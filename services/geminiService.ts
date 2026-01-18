import { GoogleGenAI } from "@google/genai";
import { Workout, UserProfile, TrainingGoal } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// Assume API_KEY is provided via Vite's define in vite.config.ts and is valid.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Realiza análise profunda de biomecânica e fisiologia usando Gemini.
 * Uses 'gemini-3-pro-preview' for complex athletic data reasoning.
 */
export const getCoachAnalysis = async (workout: Workout, profile: UserProfile, previous: Workout[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `
            Atue como um Head Coach de Corrida de Elite. Analise o seguinte treino e forneça um feedback técnico conciso e acionável.

            ATLETA: ${profile.name}, ${profile.age} anos, Nível ${profile.experience}.
            PERFIL: VO2 Max ${profile.vo2Max}, Limiar Lactato ${profile.lactateThresholdPace}.

            TREINO ATUAL:
            - Tipo: ${workout.type}
            - Distância: ${workout.distance} km
            - Pace Médio: ${workout.avgPace}
            - FC Média: ${workout.avgHR} bpm
            - Biomecânica: Cadência ${workout.biomechanics?.cadence}, Oscilação ${workout.biomechanics?.verticalOscillation}cm, Contato Solo ${workout.biomechanics?.groundContactTime}ms.

            HISTÓRICO RECENTE: ${previous.length} treinos realizados.

            Forneça:
            1. Análise da Intensidade (estava na zona correta?)
            2. Insight Biomecânico (cadência/oscilação)
            3. Recomendação para o próximo treino.
          `
        }]
      }]
    });
    
    // Always use .text property (not a method) on GenerateContentResponse
    return response.text ?? "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Erro ao processar análise com IA. Verifique sua conexão.";
  }
};

/**
 * Chat interativo sobre um treino específico.
 * Uses 'gemini-3-flash-preview' for standard conversational tasks.
 */
export const askCoachAboutWorkout = async (message: string, workout: Workout, profile: UserProfile, history: any[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `Você é o Coach de Corrida do ${profile.name}. Você tem acesso aos dados do treino dele de ${workout.date} (${workout.type}, ${workout.distance}km, pace ${workout.avgPace}). Seja motivador mas técnico.`
      }
    });

    const response = await chat.sendMessage({ message });
    // Always use .text property (not a method) on GenerateContentResponse
    return response.text ?? "O Coach está sem palavras no momento.";
  } catch (error) {
    console.error("Erro no chat:", error);
    return "Desculpe, tive um problema na conexão com o treinador.";
  }
};

/**
 * Gera um plano de treinamento completo.
 * Uses 'gemini-3-pro-preview' for advanced reasoning and training cycle planning.
 */
export const generateTrainingPlan = async (profile: UserProfile, goals: TrainingGoal[], history: Workout[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: `
            Crie um plano de treinamento de 1 semana para ${profile.name}.
            METAS: ${goals.map(g => g.title).join(', ')}.
            DADOS ATUAIS: VO2 ${profile.vo2Max}, Limiar ${profile.lactateThresholdPace}.
            ESTADO ATUAL: ${history.length} treinos no histórico.

            Formate como uma agenda semanal (Segunda a Domingo) com tipos de treino, distâncias e ritmos sugeridos.
          `
        }]
      }]
    });
    // Always use .text property (not a method) on GenerateContentResponse
    return response.text ?? "Erro ao gerar o plano. Tente novamente.";
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    return "Não foi possível criar o plano agora. Tente novamente mais tarde.";
  }
};