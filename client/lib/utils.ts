export function generateTransaction() {
    return Math.random().toString(36).substring(2, 15);
}

// Validators

export const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;