import axios from 'axios';

const API_URL = 'http://localhost:5000';

const TrainingAPIService = {
    /**
     * Fetch AI-generated debrief summary for a session
     */
    getDebriefSummary: async (sessionId) => {
        try {
            const response = await axios.get(`${API_URL}/api/debrief/${sessionId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching debrief summary:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch debrief summary'
            };
        }
    },

    /**
     * Save/Update debrief summary for a session
     */
    saveDebriefSummary: async (sessionId, debriefData) => {
        try {
            const response = await axios.post(`${API_URL}/api/debrief/${sessionId}`, debriefData);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error saving debrief summary:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to save debrief summary'
            };
        }
    }
};

export default TrainingAPIService;
