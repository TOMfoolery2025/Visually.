import { useAuth } from '../context/AuthContext';

export function useLogHistory() {
    const { token, isAuthenticated } = useAuth();

    const logAction = async (action, details = '') => {
        console.log('logAction called:', action);
        if (!isAuthenticated || !token) {
            const msg = 'History Log Skipped: Not authenticated';
            console.warn(msg);
            // alert(msg); // Optional: uncomment if you want to be annoying
            return;
        }

        try {
            const response = await fetch('/api/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action, details })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errText}`);
            }

            console.log('History saved successfully');
            // alert('Debug: History Saved Successfully!'); 
        } catch (error) {
            console.error('Failed to log history:', error);
            alert('Debug Error: Failed to save history! ' + error.message);
        }
    };

    return logAction;
}
