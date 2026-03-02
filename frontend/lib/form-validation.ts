/**
 * Custom form validation messages and utilities
 */

/**
 * Set custom validation message for an input element
 * @param element - The input element
 * @param message - Custom message to display
 */
export function setCustomValidity(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, message: string) {
  element.setCustomValidity(message);
}

/**
 * Custom validation messages for different field types
 */
export const validationMessages = {
  required: {
    default: 'This field is required',
    email: 'Email address is required',
    password: 'Password is required',
    username: 'Username is required',
    phone: 'Phone number is required',
    name: 'Name is required',
    description: 'Description is required',
    price: 'Price is required',
    quantity: 'Quantity is required',
    location: 'Location is required',
    category: 'Category is required',
    nationalId: 'National ID is required',
  },
  invalid: {
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    nationalId: 'National ID must be 9 digits',
    price: 'Please enter a valid price',
    quantity: 'Please enter a valid quantity',
    url: 'Please enter a valid URL',
  },
  pattern: {
    phone: 'Phone number must start with +251 followed by 9 digits',
    nationalId: 'National ID must be exactly 9 digits',
    username: 'Username can only contain letters, numbers, and underscores',
  },
  length: {
    min: (min: number) => `Must be at least ${min} characters`,
    max: (max: number) => `Must be no more than ${max} characters`,
    exact: (length: number) => `Must be exactly ${length} characters`,
  },
  range: {
    min: (min: number) => `Must be at least ${min}`,
    max: (max: number) => `Must be no more than ${max}`,
  },
};

/**
 * Apply custom validation messages to a form
 * @param formElement - The form element
 */
export function applyCustomValidation(formElement: HTMLFormElement) {
  const inputs = formElement.querySelectorAll('input, textarea, select');
  
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Handle invalid event
    element.addEventListener('invalid', (e) => {
      e.preventDefault();
      
      const validity = element.validity;
      let message = '';
      
      if (validity.valueMissing) {
        // Required field
        const fieldType = element.getAttribute('data-field-type') || 'default';
        message = validationMessages.required[fieldType as keyof typeof validationMessages.required] || validationMessages.required.default;
      } else if (validity.typeMismatch) {
        // Type mismatch (email, url, etc.)
        const type = element.getAttribute('type');
        if (type === 'email') {
          message = validationMessages.invalid.email;
        } else if (type === 'url') {
          message = validationMessages.invalid.url;
        }
      } else if (validity.patternMismatch) {
        // Pattern mismatch
        const fieldType = element.getAttribute('data-field-type');
        if (fieldType && fieldType in validationMessages.pattern) {
          message = validationMessages.pattern[fieldType as keyof typeof validationMessages.pattern];
        } else {
          message = 'Please match the requested format';
        }
      } else if (validity.tooShort) {
        const minLength = element.getAttribute('minlength');
        message = validationMessages.length.min(parseInt(minLength || '0'));
      } else if (validity.tooLong) {
        const maxLength = element.getAttribute('maxlength');
        message = validationMessages.length.max(parseInt(maxLength || '0'));
      } else if (validity.rangeUnderflow) {
        const min = element.getAttribute('min');
        message = validationMessages.range.min(parseFloat(min || '0'));
      } else if (validity.rangeOverflow) {
        const max = element.getAttribute('max');
        message = validationMessages.range.max(parseFloat(max || '0'));
      }
      
      if (message) {
        element.setCustomValidity(message);
      }
    });
    
    // Clear custom validity on input
    element.addEventListener('input', () => {
      element.setCustomValidity('');
    });
  });
}

/**
 * React Hook for custom form validation
 */
export function useCustomValidation() {
  const applyToForm = (formRef: React.RefObject<HTMLFormElement>) => {
    if (formRef.current) {
      applyCustomValidation(formRef.current);
    }
  };
  
  return { applyToForm };
}
