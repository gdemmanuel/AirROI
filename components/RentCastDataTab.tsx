import React from 'react';
import {
  BarChart3, TrendingUp, MapPin, Tag, Users, Activity, Home, DollarSign
} from 'lucide-react';
import ErrorBoundary from './ui/ErrorBoundary';
import { formatCurrency } from '../utils/formatCurrency';
import { RentCastProperty, MarketStats, MarketTrendEntry, RentalListing } from '../services/rentcastService';
import MarketTrendCharts from './MarketTrendCharts';

interface RentCastDataTabProps {
  propertyData: RentCastProperty | null;
  marketStats: MarketStats | null;
  marketTrends: { saleTrends: MarketTrendEntry[]; rentalTrends: MarketTrendEntry[] };
  bedroomStats: { sale?: any; rental?: any };
  rentalListings: RentalListing[] | null;
}

const RentCastDataTab: React.FC<RentCastDataTabProps> = ({
  propertyData,
  marketStats,
  marketTrends,
  bedroomStats,
  rentalListings
}) => {
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 p-4 lg:p-8 animate-in fade-in duration-700">
      {/* Market Health */}
      {marketStats && (marketStats.saleData || marketStats.rentalData) && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => toggleSection('health')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><BarChart3 size={20} /></div>
              <div className="text-left">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Market Health</h3>
                <p className="text-sm text-slate-500 mt-1">ZIP {propertyData?.zipCode}</p>
              </div>
            </div>
            <div className={`transition-transform ${expandedSection === 'health' ? 'rotate-180' : ''}`}>
              <BarChart3 size={20} className="text-slate-400" />
            </div>
          </button>

          {expandedSection === 'health' && (
            <div className="border-t border-slate-100 p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {marketStats.saleData?.medianPrice != null && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">MEDIAN PRICE</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(marketStats.saleData.medianPrice)}</p>
                  </div>
                )}
                {marketStats.saleData?.averageDaysOnMarket != null && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">AVG DOM (SALE)</p>
                    <p className="text-2xl font-black text-slate-900">{Math.round(marketStats.saleData.averageDaysOnMarket)} days</p>
                  </div>
                )}
                {marketStats.saleData?.totalListings != null && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">SALE LISTINGS</p>
                    <p className="text-2xl font-black text-slate-900">{marketStats.saleData.totalListings}</p>
                  </div>
                )}
                {marketStats.rentalData?.medianRent != null && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">MEDIAN RENT</p>
                    <p className="text-2xl font-black text-blue-900">{formatCurrency(marketStats.rentalData.medianRent)}/mo</p>
                  </div>
                )}
                {marketStats.rentalData?.averageDaysOnMarket != null && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">AVG DOM (RENTAL)</p>
                    <p className="text-2xl font-black text-blue-900">{Math.round(marketStats.rentalData.averageDaysOnMarket)} days</p>
                  </div>
                )}
                {marketStats.rentalData?.totalListings != null && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">RENTAL LISTINGS</p>
                    <p className="text-2xl font-black text-blue-900">{marketStats.rentalData.totalListings}</p>
                  </div>
                )}
              </div>

              {/* Bedroom-Matched Stats */}
              {(bedroomStats.sale || bedroomStats.rental) && (
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">
                    {propertyData?.bedrooms || '?'} Bedroom Matched Stats
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {bedroomStats.rental?.medianRent != null && (
                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Median Rent</p>
                        <p className="text-xl font-black text-emerald-900">{formatCurrency(bedroomStats.rental.medianRent)}/mo</p>
                      </div>
                    )}
                    {bedroomStats.sale?.medianPrice != null && (
                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Median Price</p>
                        <p className="text-xl font-black text-emerald-900">{formatCurrency(bedroomStats.sale.medianPrice)}</p>
                      </div>
                    )}
                    {bedroomStats.rental?.totalListings != null && (
                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Listings</p>
                        <p className="text-xl font-black text-emerald-900">{bedroomStats.rental.totalListings}</p>
                      </div>
                    )}
                    {bedroomStats.sale?.averageDaysOnMarket != null && (
                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Avg DOM</p>
                        <p className="text-xl font-black text-emerald-900">{Math.round(bedroomStats.sale.averageDaysOnMarket)} days</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Market Trends */}
      {(marketTrends.saleTrends.length > 2 || marketTrends.rentalTrends.length > 2) && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => toggleSection('trends')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><TrendingUp size={20} /></div>
              <div className="text-left">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Market Trends</h3>
                <p className="text-sm text-slate-500 mt-1">Historical Data (2020+)</p>
              </div>
            </div>
            <div className={`transition-transform ${expandedSection === 'trends' ? 'rotate-180' : ''}`}>
              <TrendingUp size={20} className="text-slate-400" />
            </div>
          </button>

          {expandedSection === 'trends' && (
            <div className="border-t border-slate-100 p-6">
              <ErrorBoundary>
                <MarketTrendCharts
                  saleTrends={marketTrends.saleTrends}
                  rentalTrends={marketTrends.rentalTrends}
                  zipCode={propertyData?.zipCode}
                />
              </ErrorBoundary>
            </div>
          )}
        </div>
      )}

      {/* Sale Comparables */}
      {propertyData?.avmComparables && propertyData.avmComparables.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => toggleSection('saleComps')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><DollarSign size={20} /></div>
              <div className="text-left">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Sale Comparables</h3>
                <p className="text-sm text-slate-500 mt-1">{propertyData.avmComparables.length} properties</p>
              </div>
            </div>
            <div className={`transition-transform ${expandedSection === 'saleComps' ? 'rotate-180' : ''}`}>
              <DollarSign size={20} className="text-slate-400" />
            </div>
          </button>

          {expandedSection === 'saleComps' && (
            <div className="border-t border-slate-100 p-6">
              <div className="space-y-3">
                {propertyData.avmComparables.map((comp, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-black text-slate-900">{comp.formattedAddress}</p>
                        <p className="text-sm text-slate-500">{comp.bedrooms}bd / {comp.bathrooms}ba • {comp.squareFootage?.toLocaleString()}sf</p>
                      </div>
                      {comp.correlation != null && (
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                          comp.correlation >= 0.9 ? 'bg-emerald-100 text-emerald-700' :
                          comp.correlation >= 0.7 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{(comp.correlation * 100).toFixed(0)}% match</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-black text-slate-900">{formatCurrency(comp.price)}</span>
                      <span className="text-slate-500">{comp.distance?.toFixed(1)}mi • {comp.daysOnMarket} DOM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rental Listings */}
      {rentalListings && rentalListings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => toggleSection('rentals')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-xl text-green-600"><Home size={20} /></div>
              <div className="text-left">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Active Rental Listings</h3>
                <p className="text-sm text-slate-500 mt-1">{rentalListings.length} properties</p>
              </div>
            </div>
            <div className={`transition-transform ${expandedSection === 'rentals' ? 'rotate-180' : ''}`}>
              <Home size={20} className="text-slate-400" />
            </div>
          </button>

          {expandedSection === 'rentals' && (
            <div className="border-t border-slate-100 p-6">
              <div className="space-y-3">
                {rentalListings.map((listing, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-black text-slate-900">{listing.formattedAddress}</p>
                        <p className="text-sm text-slate-500">{listing.bedrooms}bd / {listing.bathrooms}ba • {listing.squareFootage?.toLocaleString()}sf</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-black text-emerald-700">{formatCurrency(listing.price)}/mo</span>
                      <span className="text-slate-500">{listing.daysOnMarket} DOM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!propertyData && !marketStats && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <BarChart3 size={48} className="mx-auto mb-4 text-slate-400" />
          <p className="text-lg font-black text-slate-600 uppercase tracking-wider mb-2">No RentCast Data Available</p>
          <p className="text-slate-500">Run an underwriting analysis to view RentCast market data</p>
        </div>
      )}
    </div>
  );
};

export default RentCastDataTab;
