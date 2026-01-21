import { GoogleGenAI } from "@google/genai";
import { Workout, UserProfile, TrainingGoal } from "../types";

/**
 * Realiza análise profunda de biomecânica e fisiologia.
 */
export const getCoachAnalysis = async (workout: Workout, profile: UserProfile, previous: Workout[]): Promise<string> => {
  // Criar instância dentro da função para garantir o uso da chave mais atual
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const cadence = workout.biomechanics?.cadence || "N/A";
    const oscillation = workout.biomechanics?.verticalOscillation || "N/A";
    const gct = workout.biomechanics?.groundContactTime || "N/A";

    // Fix: Using gemini-3-pro-preview for complex biomechanical and physiological analysis as per guidelines
    // Also incorporating recent history for longitudinal perspective.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analise este treino para o atleta ${profile.name} (${profile.experience}):
        DADOS DO TREINO: Distância ${workout.distance}km, Pace ${workout.avgPace}, FC ${workout.avgHR}bpm.
        DINÂMICAS: Cadência ${cadence}ppm, Oscilação ${oscillation}cm, Contato ${gct}ms.
        Contexto do Atleta: Limiar Lactato ${profile.lactateThresholdPace}.
        Histórico Recente (últimos 3 treinos): ${previous.slice(0, 3).map(p => `${p.type}: ${p.distance}km em ${p.avgPace}`).join(' | ')}`,
      config: {
        systemInstruction: "Você é um Head Coach de Corrida de elite. Forneça análises técnicas de performance e biomecânica. Não dê conselhos médicos, foque em treinamento esportivo e eficiência mecânica.",
        temperature: 0.7,
      },
    });
    
    return response.text ?? "O Coach analisou os dados, mas não gerou um feedback textual.";
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error.message?.includes('429')) return "Limite de uso atingido. Tente novamente em 1 minuto.";
    return "O Coach está temporariamente indisponível para análise profunda. O chat técnico continua ativo.";
  }
};

/**
 * Chat interativo sobre um treino específico.
 */
export const askCoachAboutWorkout = async (message: string, workout: Workout, profile: UserProfile, history: any[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Fix: Ensure the chat system instruction includes the context of the specific workout and previous messages
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `Você é o Coach de Corrida do ${profile.name}. Responda dúvidas técnicas sobre o treino de ${workout.date} (${workout.type}, ${workout.distance}km). Seja motivador mas extremamente técnico. Histórico de conversa: ${JSON.stringify(history.slice(-3))}`
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text ?? "Não consegui processar sua dúvida agora.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Erro ao conectar com o Coach.";
  }
};

/**
 * Gera um plano de treinamento completo.
 */
export const generateTrainingPlan = async (profile: UserProfile, goals: TrainingGoal[], history: Workout[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Fix: Using gemini-3-pro-preview for training periodization (complex task)
    // and ensuring athlete history and specific metrics are considered.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Gere um plano semanal para ${profile.name}. 
        Metas: ${goals.map(g => g.title).join(', ')}. 
        VO2 Max: ${profile.vo2Max}.
        Limiar Lactato: ${profile.lactateThresholdPace} / ${profile.lactateThresholdHR}bpm.
        Volume de Treinos Recentes: ${history.slice(0, 5).map(h => `${h.type} ${h.distance}km`).join(', ')}.`,
      config: {
        systemInstruction: "Crie planos de treinamento baseados em ciência do esporte (periodização). Forneça o plano em formato estruturado."
      }
    });
    return response.text ?? "Erro ao gerar plano.";
  } catch (error) {
    console.error("Plan Gen Error:", error);
    return "Não foi possível gerar seu plano agora.";
  }
};