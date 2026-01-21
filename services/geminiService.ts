import { GoogleGenAI } from "@google/genai";
import { Workout, UserProfile, TrainingGoal } from "../types";

// Inicialização centralizada
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Realiza análise profunda de biomecânica e fisiologia usando Gemini.
 */
export const getCoachAnalysis = async (workout: Workout, profile: UserProfile, previous: Workout[]): Promise<string> => {
  try {
    const cadence = workout.biomechanics?.cadence || "N/A";
    const oscillation = workout.biomechanics?.verticalOscillation || "N/A";
    const gct = workout.biomechanics?.groundContactTime || "N/A";

    // Simplificado: Usando objeto direto em vez de array para contents
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{
          text: `
            Atue como um Head Coach de Corrida de Elite. Analise o seguinte treino e forneça um feedback técnico conciso e acionável.

            ATLETA: ${profile.name}, Nível ${profile.experience}.
            PERFIL: VO2 Max ${profile.vo2Max}, Limiar Lactato ${profile.lactateThresholdPace}.

            TREINO ATUAL:
            - Tipo: ${workout.type}
            - Distância: ${workout.distance} km
            - Pace Médio: ${workout.avgPace}
            - FC Média: ${workout.avgHR} bpm
            - Biomecânica: Cadência ${cadence}, Oscilação ${oscillation}cm, Contato Solo ${gct}ms.

            HISTÓRICO RECENTE: Baseado nos últimos ${previous.length} treinos.

            Forneça em formato Markdown:
            1. **Análise da Intensidade**
            2. **Insight Biomecânico**
            3. **Recomendação Próximo Passo**.
          `
        }]
      }
    });
    
    return response.text ?? "O Coach não conseguiu gerar uma resposta clara. Verifique os dados.";
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Se o chat funciona e este não, o problema costuma ser o formato do prompt ou bloqueio de segurança
    return `Ocorreu um erro na análise: ${error.message?.includes('safety') ? 'Conteúdo retido por filtros de segurança.' : 'Serviço temporariamente instável.'}`;
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
        systemInstruction: `Você é o Coach de Corrida do ${profile.name}. Você tem acesso aos dados do treino dele de ${workout.date}. Seja técnico e motivador.`
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text ?? "O Coach está pensando...";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Erro ao conectar com o Coach no chat.";
  }
};

/**
 * Gera um plano de treinamento completo.
 */
export const generateTrainingPlan = async (profile: UserProfile, goals: TrainingGoal[], history: Workout[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{
          text: `Crie um plano de 1 semana para ${profile.name} (VO2 ${profile.vo2Max}). Metas: ${goals.map(g => g.title).join(', ')}.`
        }]
      }
    });
    return response.text ?? "Erro ao gerar plano.";
  } catch (error) {
    console.error("Plan Gen Error:", error);
    return "Erro ao gerar plano semanal.";
  }
};