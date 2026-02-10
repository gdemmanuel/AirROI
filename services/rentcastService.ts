
import { cacheService } from './cacheService';

const RENTCAST_API_KEY = import.meta.env.VITE_RENTCAST_API_KEY;

export interface RentCastProperty {
    id: string;
    formattedAddress: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    lotSize: number;
    yearBuilt: number;
    propertyType: string;
    lastSalePrice?: number;
    lastSaleDate?: string;
    taxMonthly?: number;
    hoaMonthly?: number;
    images?: string[];
    mainImage?: string;
}

export const fetchPropertyData = async (address: string): Promise<RentCastProperty | null> => {
    if (!RENTCAST_API_KEY) {
        console.warn("RentCast API Key missing. Please add VITE_RENTCAST_API_KEY to your .env file.");
        return null;
    }

    try {
        const cleanAddress = address.trim();
        
        // 🔧 Check cache first
        const cached = cacheService.get<RentCastProperty>('fetchPropertyData', { address: cleanAddress });
        if (cached) {
            return cached;
        }

        const encodedAddress = encodeURIComponent(cleanAddress);

        console.log(`[RentCast] Fetching data for: ${cleanAddress}`);

        // 1. Try to get Active Listings (the most accurate for current Price)
        const listingRes = await fetch(`https://api.rentcast.io/v1/listings/sale?address=${encodedAddress}&status=Active`, {
            headers: { 'X-Api-Key': RENTCAST_API_KEY, 'Accept': 'application/json' }
        });

        let listingData: any;
        if (listingRes.ok) {
            const listings = await listingRes.json();
            if (listings && listings.length > 0) {
                listingData = listings[0];
                console.log(`[RentCast] Found active listing price: $${listingData.price}`);
            }
        }

        // 2. Try Valuation (AVM) endpoint - often has more recent prices
        let avmPrice: number | undefined;
        try {
            const avmRes = await fetch(`https://api.rentcast.io/v1/avm/value?address=${encodedAddress}`, {
                headers: { 'X-Api-Key': RENTCAST_API_KEY, 'Accept': 'application/json' }
            });
            if (avmRes.ok) {
                const avm = await avmRes.json();
                avmPrice = avm.price;
                console.log(`[RentCast] AVM Estimate: $${avmPrice}`);
            }
        } catch (e) {
            console.warn("[RentCast] AVM fetch failed", e);
        }

        // 3. Get Property Record (for structural details and TAX/HOA)
        const propRes = await fetch(`https://api.rentcast.io/v1/properties?address=${encodedAddress}`, {
            headers: { 'X-Api-Key': RENTCAST_API_KEY, 'Accept': 'application/json' }
        });

        if (!propRes.ok) {
            const errorText = await propRes.text();
            console.error(`RentCast API Error: ${propRes.status} - ${errorText}`);
            if (listingData) {
                const result = {
                    id: listingData.id || 'N/A',
                    formattedAddress: listingData.formattedAddress || cleanAddress,
                    addressLine1: listingData.addressLine1 || '',
                    city: listingData.city || '',
                    state: listingData.state || '',
                    zipCode: listingData.zipCode || '',
                    bedrooms: listingData.bedrooms || 0,
                    bathrooms: listingData.bathrooms || 0,
                    squareFootage: listingData.squareFootage || 0,
                    lotSize: listingData.lotSize || 0,
                    yearBuilt: listingData.yearBuilt || 0,
                    propertyType: listingData.propertyType || '',
                    lastSalePrice: listingData.price
                };
                // 🔧 Cache the result
                cacheService.set('fetchPropertyData', { address: cleanAddress }, result);
                return result;
            }
            return null;
        }

        const propData = await propRes.json();

        if (propData && propData.length > 0) {
            const property = propData[0];
            const finalPrice = listingData?.price || avmPrice || property.lastSalePrice;

            // Extract Tax - Get the most recent tax record
            let taxMonthly = 0;
            if (property.propertyTaxes) {
                const years = Object.keys(property.propertyTaxes).sort((a, b) => parseInt(b) - parseInt(a));
                if (years.length > 0) {
                    const latestTax = property.propertyTaxes[years[0]].total;
                    taxMonthly = Math.round(latestTax / 12);
                    console.log(`[RentCast] Found Tax for ${years[0]}: $${latestTax} ($${taxMonthly}/mo)`);
                }
            }

            // Extract HOA
            let hoaMonthly = 0;
            if (property.hoa && property.hoa.fee) {
                hoaMonthly = property.hoa.fee;
                console.log(`[RentCast] Found HOA Fee: $${hoaMonthly}/mo`);
            }

            const finalImages = listingData?.images && listingData.images.length > 0 ? listingData.images : (property.images || []);
            const finalMainImage = listingData?.propertyImage || (listingData?.images && listingData.images[0]) || (property.images && property.images[0]);

            console.log(`[RentCast] Image Data:`, {
                listingImages: listingData?.images?.length || 0,
                propertyImages: property.images?.length || 0,
                finalMainImage: finalMainImage ? 'Found' : 'Missing'
            });

            const result = {
                ...property,
                bedrooms: listingData?.bedrooms || property.bedrooms,
                bathrooms: listingData?.bathrooms || property.bathrooms,
                squareFootage: listingData?.squareFootage || property.squareFootage,
                lastSalePrice: finalPrice,
                taxMonthly,
                hoaMonthly,
                images: finalImages,
                mainImage: finalMainImage
            } as RentCastProperty;

            // 🔧 Cache the result
            cacheService.set('fetchPropertyData', { address: cleanAddress }, result);
            return result;
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch property data from RentCast", error);
        return null;
    }
};

export const fetchMarketStats = async (zipCode: string): Promise<any | null> => {
    if (!RENTCAST_API_KEY) return null;

    try {
        // 🔧 Check cache first
        const cached = cacheService.get<any>('fetchMarketStats', { zipCode });
        if (cached) {
            return cached;
        }

        const response = await fetch(`https://api.rentcast.io/v1/markets?zipCode=${zipCode}`, {
            headers: { 'X-Api-Key': RENTCAST_API_KEY, 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.error(`RentCast Market Stats Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        // 🔧 Cache the result
        cacheService.set('fetchMarketStats', { zipCode }, data);
        return data;
    } catch (error) {
        console.error("Failed to fetch market stats from RentCast", error);
        return null;
    }
};

export const fetchRentEstimate = async (address: string): Promise<any | null> => {
    if (!RENTCAST_API_KEY) return null;

    try {
        // 🔧 Check cache first
        const cached = cacheService.get<any>('fetchRentEstimate', { address });
        if (cached) {
            return cached;
        }

        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(`https://api.rentcast.io/v1/avm/rent/long-term?address=${encodedAddress}`, {
            headers: { 'X-Api-Key': RENTCAST_API_KEY, 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.error(`RentCast Rent Estimate Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        // Log what we got back
        console.log(`[RentCast] Rent Estimate Response:`, {
            rent: data.rent,
            hasComps: data.comparableProperties ? data.comparableProperties.length : 0
        });
        
        // 🔧 Cache the result
        cacheService.set('fetchRentEstimate', { address }, data);
        return data;
    } catch (error) {
        console.error("Failed to fetch rent estimate from RentCast", error);
        return null;
    }
};

export const fetchSTRData = async (address: string, propertyType?: string, bedrooms?: number, bathrooms?: number): Promise<any | null> => {
    // RentCast does NOT have short-term rental data
    // We'll use Claude web search instead, which is called in App.tsx
    console.log('[RentCast] Note: RentCast does not support short-term rental data. Using Claude web search instead.');
    return null;
}

export const fetchSTRComps = async (address: string, propertyType?: string, bedrooms?: number, bathrooms?: number): Promise<any | null> => {
    // UPDATED: Fetch RentCast SALES comparables (actual sold properties)
    // These are more valuable for STR analysis than LTR rentals
    // RentCast does NOT have STR/Airbnb comp data, so sales comps are the best alternative
    if (!RENTCAST_API_KEY) return null;

    try {
        // 🔧 Check cache first
        const cached = cacheService.get<any>('fetchSTRComps', { address, propertyType, bedrooms, bathrooms });
        if (cached) {
            return cached;
        }

        const encodedAddress = encodeURIComponent(address);
        // Use the Comparables API to get sold properties in the area
        let url = `https://api.rentcast.io/v1/comps/sale?address=${encodedAddress}&radius=1&limit=5`;
        if (propertyType) url += `&propertyType=${encodeURIComponent(propertyType)}`;
        if (bedrooms) url += `&bedrooms=${bedrooms}`;

        console.log(`[RentCast] Fetching SALES comps from: ${url}`);

        const response = await fetch(url, {
            headers: { 'X-Api-Key': RENTCAST_API_KEY, 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.error(`RentCast Sales Comps Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        console.log(`[RentCast] Sales Comps Response:`, data);
        
        if (data && Array.isArray(data) && data.length > 0) {
            console.log(`[RentCast] ✅ Found ${data.length} sales comparables`);
            data.forEach((comp: any, i: number) => {
                const addr = comp.formattedAddress || comp.address || 'N/A';
                const price = comp.price || comp.salePrice || 'N/A';
                const saleDate = comp.saleDate || 'N/A';
                console.log(`  ${i + 1}. ${addr}: Sale Price $${price} (${saleDate})`);
            });
            // Transform the data to match expected format for STR analysis
            const transformedData = data.map((comp: any) => ({
                formattedAddress: comp.formattedAddress || comp.address,
                address: comp.formattedAddress || comp.address,
                price: comp.price || comp.salePrice,
                salePrice: comp.price || comp.salePrice,
                saleDate: comp.saleDate,
                bedrooms: comp.bedrooms,
                bathrooms: comp.bathrooms,
                squareFootage: comp.squareFootage,
                distance: comp.distance || 0,
                annualRevenue: comp.estimatedAnnualRevenue || 'N/A' // RentCast may estimate this
            }));
            // 🔧 Cache the result
            cacheService.set('fetchSTRComps', { address, propertyType, bedrooms, bathrooms }, transformedData);
            return transformedData;
        } else {
            console.warn(`[RentCast] No sales comps returned (empty array or null)`);
        }
        
        // 🔧 Cache the empty result
        cacheService.set('fetchSTRComps', { address, propertyType, bedrooms, bathrooms }, null);
        return null;
    } catch (error) {
        console.error("Failed to fetch sales comps from RentCast", error);
        return null;
    }
}
