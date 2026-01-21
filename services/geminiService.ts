import { GoogleGenAI } from "@google/genai";
import { Workout, UserProfile, TrainingGoal } from "../types";

// Inicialização centralizada garantindo o uso da API_KEY do ambiente
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Realiza análise profunda de biomecânica e fisiologia.
 * Usando 'gemini-flash-lite-latest' por ser ultra-rápido, evitando timeouts em plataformas como Vercel.
 */
export const getCoachAnalysis = async (workout: Workout, profile: UserProfile, previous: Workout[]): Promise<string> => {
  try {
    const cadence = workout.biomechanics?.cadence || "N/A";
    const oscillation = workout.biomechanics?.verticalOscillation || "N/A";
    const gct = workout.biomechanics?.groundContactTime || "N/A";

    // Estrutura de prompt otimizada para resposta rápida
    const prompt = `
      Atue como um Head Coach de Corrida. Analise este treino:
      ATLETA: ${profile.name}, Nível ${profile.experience}.
      TREINO: ${workout.type}, ${workout.distance}km, Pace ${workout.avgPace}, FC ${workout.avgHR}.
      BIOMECÂNICA: Cadência ${cadence}, Oscilação ${oscillation}cm, Contato Solo ${gct}ms.
      
      Forneça um feedback técnico Markdown curto (máx 150 palavras):
      1. Intensidade (estava na zona correta?)
      2. Eficiência Biomecânica.
      3. Próximo passo sugerido.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    return response.text ?? "Análise concluída, mas sem texto gerado.";
  } catch (error: any) {
    console.error("Gemini Analysis Detailed Error:", error);
    if (error.message?.includes('429')) return "Erro: Limite de requisições atingido. Aguarde um momento.";
    if (error.message?.includes('safety')) return "Erro: A análise foi bloqueada pelos filtros de segurança da IA.";
    return "Erro na comunicação com o Coach. Tente novamente em alguns segundos.";
  }
};

/**
 * Chat interativo sobre um treino específico.
 */
export const askCoachAboutWorkout = async (message: string, workout: Workout, profile: UserProfile, history: any[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `Você é o Coach de Corrida do ${profile.name}. Responda dúvidas sobre o treino de ${workout.date} (${workout.distance}km). Seja breve e técnico.`
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text ?? "O Coach não conseguiu responder agora.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Desculpe, tive um problema ao processar sua dúvida.";
  }
};

/**
 * Gera um plano de treinamento completo.
 */
export const generateTrainingPlan = async (profile: UserProfile, goals: TrainingGoal[], history: Workout[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `Gere um plano de 1 semana para ${profile.name} (VO2 ${profile.vo2Max}). Metas: ${goals.map(g => g.title).join(', ')}.`
        }]
      }]
    });
    return response.text ?? "Erro ao gerar plano.";
  } catch (error) {
    console.error("Plan Gen Error:", error);
    return "Não foi possível gerar seu plano agora.";
  }
};