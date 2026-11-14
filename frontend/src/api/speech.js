import apiClient from "./client";

export const speechApi = {
  translate: async (text, sourceLang = "en", targetLang = "hi") => {
    try {
      const { data } = await apiClient.post("/speech/translate", {
        text,
        sourceLang,
        targetLang,
      });
      return data?.data?.text || text;
    } catch {
      return text;
    }
  },

  textToSpeech: async (text, language = "hi", gender = "female") => {
    try {
      const { data } = await apiClient.post("/speech/tts", {
        text,
        language,
        gender,
      });
      return data?.data || null;
    } catch {
      return null;
    }
  },

  speechToText: async (audioBase64, language = "hi") => {
    try {
      const { data } = await apiClient.post("/speech/asr", {
        audioBase64,
        language,
      });
      return data?.data || null;
    } catch {
      return null;
    }
  },

  getServiceStatus: async () => {
    try {
      const { data } = await apiClient.get("/speech/languages");
      return data?.data || null;
    } catch {
      return null;
    }
  },
};

export default speechApi;
