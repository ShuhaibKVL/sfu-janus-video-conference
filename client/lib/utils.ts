export function generateTransaction() {
    return Math.random().toString(36).substring(2, 15);
}

// Validators

export const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Authentication

export function getAuthenticatedUserId(): string | null {
    try {
        const user = localStorage.getItem("user");
        if (!user) return null;
        const userData = JSON.parse(user);
        return userData._id || null;
    } catch (error) {
        console.error("Failed to get user ID:", error);
        return null;
    }
}