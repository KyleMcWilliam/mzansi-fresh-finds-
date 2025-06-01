function isValidEmail(email) {
  const regex = /\S+@\S+\.\S+/;
  return regex.test(email);
}

function isNotEmpty(value) {
  return value.trim() !== "";
}

function isPasswordComplex(password, minLength = 8) {
  return password.length >= minLength;
}

function displayError(inputElement, message) {
  let errorElement = document.getElementById(inputElement.id + '-error');
  if (!errorElement) {
    errorElement = document.createElement('span');
    errorElement.id = inputElement.id + '-error';
    errorElement.className = 'error-message';
    inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
  }
  errorElement.textContent = message;
  inputElement.classList.add('invalid-field');
  errorElement.style.display = 'block';
}

function clearError(inputElement) {
  const errorElement = document.getElementById(inputElement.id + '-error');
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  inputElement.classList.remove('invalid-field');
}

function clearAllErrors(formElement) {
  const invalidFields = formElement.querySelectorAll('.invalid-field');
  invalidFields.forEach(field => {
    clearError(field);
  });

  const errorMessages = formElement.querySelectorAll('.error-message');
  errorMessages.forEach(errorMessage => {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  });
}

export { isValidEmail, isNotEmpty, isPasswordComplex, displayError, clearError, clearAllErrors };
