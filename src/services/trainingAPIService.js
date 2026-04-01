import axios from 'axios';

const API_URL = 'http://localhost:5000';

const TrainingAPIService = {
    /**
     * Fetch AI-generated debrief summary for a session
     */
    getDebriefSummary: async (sessionId) => {
        try {
            const response = await axios.get(`${API_URL}/api/sessions/debrief/${sessionId}`);
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
            const response = await axios.post(`${API_URL}/api/sessions/debrief/${sessionId}`, debriefData);
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
    },

    /**
     * Get training data by session ID
     */
    getTrainingDataBySession: async (sessionId) => {
        try {
            const response = await axios.get(`${API_URL}/api/sessions/training-data/session/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching training data:', error);
            return null;
        }
    },

    /**
     * Create report from training data
     */
    createReport: async (trainingDataId) => {
        try {
            const response = await axios.post(`${API_URL}/api/sessions/report/${trainingDataId}`);
            return response.data;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    },

    /**
     * Archive report to history
     */
    archiveReport: async (reportId, notes) => {
        try {
            const response = await axios.post(`${API_URL}/api/sessions/archive/${reportId}`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error archiving report:', error);
            throw error;
        }
    },

    /**
     * Get report by training data ID
     */
    getReport: async (trainingDataId) => {
        try {
            const response = await axios.get(`${API_URL}/api/sessions/report/training/${trainingDataId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching report:', error);
            return null;
        }
    },

    /**
     * Get archived reports from history
     */
    getArchivedReports: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/sessions/archived-reports`);
            return response.data;
        } catch (error) {
            console.error('Error fetching archived reports:', error);
            return [];
        }
    },

    /**
     * Mark a session as complete
     */
    markSessionComplete: async (sessionId, additionalRemarks) => {
        try {
            const response = await axios.post(`${API_URL}/api/sessions/${sessionId}/complete`, { additionalRemarks });
            return response.data;
        } catch (error) {
            console.error('Error marking session complete:', error);
            throw error;
        }
    }
};

export default TrainingAPIService;
