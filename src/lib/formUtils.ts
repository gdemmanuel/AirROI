import { useForm, SubmitHandler, RegisterOptions } from 'react-hook-form';

/**
 * React Hook Form - Configuration and Examples
 * Simplifies form handling with validation and error management
 */

/**
 * Common validation rules for forms
 */
export const formValidation = {
  address: {
    required: 'Address is required',
    minLength: { value: 5, message: 'Address must be at least 5 characters' },
  },
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  },
  password: {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
  },
  number: (name: string) => ({
    required: `${name} is required`,
    pattern: {
      value: /^[0-9]+(\.[0-9]{1,2})?$/,
      message: `${name} must be a valid number`,
    },
  }),
  percent: (name: string) => ({
    required: `${name} is required`,
    min: { value: 0, message: `${name} must be at least 0` },
    max: { value: 100, message: `${name} cannot exceed 100` },
  }),
};

/**
 * Example: Property Analysis Form
 * Shows how to use React Hook Form in AirROI
 */
export interface PropertyFormInputs {
  address: string;
  strategy: 'STR' | 'MTR' | 'LTR';
  price: number;
  downPayment: number;
  mortgageRate: number;
}

export const usePropertyForm = (onSubmit: SubmitHandler<PropertyFormInputs>) => {
  return useForm<PropertyFormInputs>({
    mode: 'onChange', // Validate as user types
    defaultValues: {
      address: '',
      strategy: 'STR',
      price: 0,
      downPayment: 20,
      mortgageRate: 7.5,
    },
  });
};

/**
 * Example: Login Form
 */
export interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const useLoginForm = (onSubmit: SubmitHandler<LoginFormInputs>) => {
  return useForm<LoginFormInputs>({
    mode: 'onBlur', // Validate on blur
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
};

/**
 * Form Field Component - Reusable input with error handling
 */
export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
  </div>
);

/**
 * Form Input Component - Styled input field
 */
export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={`input-field ${error ? 'border-red-500' : ''} ${className || ''}`}
      {...props}
    />
  )
);

FormInput.displayName = 'FormInput';

/**
 * Usage Example in Component:
 * 
 * const PropertyAnalysisForm = () => {
 *   const { register, handleSubmit, formState: { errors } } = usePropertyForm(onSubmit);
 * 
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <FormField label="Address" error={errors.address?.message} required>
 *         <FormInput
 *           {...register('address', formValidation.address)}
 *           placeholder="Enter property address"
 *         />
 *       </FormField>
 *       
 *       <FormField label="Strategy" required>
 *         <select {...register('strategy')}>
 *           <option value="STR">Short-Term Rental</option>
 *           <option value="MTR">Mid-Term Rental</option>
 *           <option value="LTR">Long-Term Rental</option>
 *         </select>
 *       </FormField>
 *       
 *       <button type="submit" className="btn-primary">
 *         Analyze Property
 *       </button>
 *     </form>
 *   );
 * };
 */
