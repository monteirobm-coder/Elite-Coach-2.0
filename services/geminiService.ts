import { GoogleGenAI } from "@google/genai";
import { Workout, UserProfile, TrainingGoal } from "../types";

// Inicialização recomendada usando a variável de ambiente process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Realiza análise profunda de biomecânica e fisiologia usando Gemini.
 * Alterado para 'gemini-3-flash-preview' para maior estabilidade em produção.
 */
export const getCoachAnalysis = async (workout: Workout, profile: UserProfile, previous: Workout[]): Promise<string> => {
  try {
    // Verificação básica de dados para evitar prompt vazio
    const cadence = workout.biomechanics?.cadence || "N/A";
    const oscillation = workout.biomechanics?.verticalOscillation || "N/A";
    const gct = workout.biomechanics?.groundContactTime || "N/A";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
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

            HISTÓRICO RECENTE: Analise com base nos últimos ${previous.length} treinos fornecidos no contexto.

            Forneça em formato Markdown:
            1. **Análise da Intensidade** (estava na zona correta para o tipo ${workout.type}?)
            2. **Insight Biomecânico** (foco em eficiência)
            3. **Recomendação Próximo Passo**.
          `
        }]
      }]
    });
    
    return response.text ?? "Não foi possível gerar a análise. Tente novamente.";
  } catch (error: any) {
    console.error("Erro detalhado no Gemini Analysis:", error);
    if (error.message?.includes("model")) {
      return "Erro: Modelo de IA temporariamente indisponível para análise profunda.";
    }
    return "Erro ao processar análise. Verifique se os dados do treino estão completos.";
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
        systemInstruction: `Você é o Coach de Corrida do ${profile.name}. Você tem acesso aos dados do treino dele de ${workout.date} (${workout.type}, ${workout.distance}km, pace ${workout.avgPace}). Seja motivador mas técnico.`
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text ?? "O Coach está processando sua dúvida...";
  } catch (error) {
    console.error("Erro no chat:", error);
    return "Desculpe, tive um problema na conexão com o treinador.";
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
    return response.text ?? "Erro ao gerar o plano semanal.";
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    return "Não foi possível criar o plano agora. Tente novamente mais tarde.";
  }
};