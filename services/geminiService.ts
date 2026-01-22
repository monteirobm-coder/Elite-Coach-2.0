
import { GoogleGenAI, Type } from "@google/genai";
import { Workout, UserProfile, TrainingGoal, Race } from "../types";

/**
 * Busca provas de rua em Manaus/AM para os próximos 4 meses usando Google Search.
 */
export const searchManausRaces = async (): Promise<{ races: Partial<Race>[], sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date();
  const fourMonthsLater = new Date();
  fourMonthsLater.setMonth(today.getMonth() + 4);

  const dateRange = `de ${today.toLocaleDateString('pt-BR')} até ${fourMonthsLater.toLocaleDateString('pt-BR')}`;
  
  const prompt = `
    Pesquise corridas de rua, maratonas e eventos de atletismo oficiais que acontecerão em Manaus/AM no período ${dateRange}.
    
    INSTRUÇÕES:
    1. Retorne APENAS um array JSON válido.
    2. Cada objeto deve ter: "name" (nome da prova), "date" (data no formato YYYY-MM-DD), "distance" (ex: 5km, 10km, 21km), "location" (específico se disponível), e "status" (sempre "Interessado").
    3. Se encontrar o link de inscrição, mencione-o no nome ou local.
    
    Formato esperado:
    [
      {"name": "Maratona de Manaus", "date": "2025-10-20", "distance": "42km", "location": "Ponta Negra", "status": "Interessado"}
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Forçamos o modelo a focar em precisão de datas e locais
        systemInstruction: "Você é um assistente especializado em eventos esportivos na região Norte do Brasil. Sua tarefa é encontrar datas precisas de corridas em Manaus.",
      },
    });

    const text = response.text || "[]";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Tenta extrair o JSON do texto (o modelo pode colocar markdown)
    const jsonMatch = text.match(/\[.*\]/s);
    const races = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return { races, sources };
  } catch (error) {
    console.error("Search Races Error:", error);
    return { races: [], sources: [] };
  }
};

/**
 * Realiza análise profunda de biomecânica e fisiologia cruzando dados técnicos com percepção do usuário.
 */
export const getCoachAnalysis = async (
  workout: Workout, 
  profile: UserProfile, 
  previous: Workout[],
  userPerception: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const cadence = workout.biomechanics?.cadence || "N/A";
    const oscillation = workout.biomechanics?.verticalOscillation || "N/A";
    const gct = workout.biomechanics?.groundContactTime || "N/A";
    const stride = workout.biomechanics?.strideLength || "N/A";

    const prs = `5k: ${profile.prs.k5}, 10k: ${profile.prs.k10}, 21k: ${profile.prs.k21}, 42k: ${profile.prs.k42}`;
    const biometrics = `Peso: ${profile.weight}kg, Gordura: ${profile.bodyFat}%, VO2: ${profile.vo2Max}`;

    const prompt = `
      Atue como Head Coach de Corrida. Analise o treino cruzando DADOS TÉCNICOS + PERCEPÇÃO DO ATLETA.

      PERCEPÇÃO DO ATLETA: "${userPerception}"

      DADOS DO TREINO:
      - Tipo: ${workout.type} (${workout.title})
      - Distância: ${workout.distance}km | Tempo: ${workout.duration} | Pace Médio: ${workout.avgPace}
      - FC Média: ${workout.avgHR}bpm | FC Máx: ${workout.maxHR || 'N/A'}
      - Dinâmicas: Cadência ${cadence}ppm, Oscilação ${oscillation}cm, Contato Solo ${gct}ms, Passada ${stride}m.

      PERFIL DO ATLETA (${profile.experience}):
      - ${biometrics}
      - Limiares: Pace ${profile.lactateThresholdPace}, FC ${profile.lactateThresholdHR}bpm
      - Recordes (PRs): ${prs}

      HISTÓRICO RECENTE:
      ${previous.slice(0, 3).map(p => `- ${p.date}: ${p.type}, ${p.distance}km em ${p.avgPace}`).join('\n')}

      INSTRUÇÕES:
      1. Avalie se a percepção do atleta condiz com os dados fisiológicos (FC vs Pace).
      2. Analise a biomecânica em relação ao cansaço relatado.
      3. Verifique se o treino foi condizente com o nível de condicionamento (baseado nos PRs e VO2).
      4. Dê um feedback técnico, motivador e direto (Markdown).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é um Head Coach de elite especializado em fisiologia do exercício e biomecânica. Sua análise deve ser baseada em evidências, correlacionando percepção subjetiva com dados objetivos de sensores Garmin.",
        temperature: 0.7,
      },
    });
    
    return response.text ?? "O Coach analisou os dados, mas não gerou um feedback textual.";
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error.message?.includes('429')) return "Limite de uso atingido. Tente novamente em 1 minuto.";
    return "O Coach está temporariamente indisponível para análise profunda.";
  }
};

/**
 * Chat interativo sobre um treino específico.
 */
export const askCoachAboutWorkout = async (message: string, workout: Workout, profile: UserProfile, history: any[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `Você é o Coach de Corrida do ${profile.name}. Responda dúvidas técnicas sobre o treino de ${workout.date}. Histórico recente: ${JSON.stringify(history.slice(-3))}`
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Gere um plano semanal para ${profile.name}. Metas: ${goals.map(g => g.title).join(', ')}. VO2: ${profile.vo2Max}. Histórico: ${history.slice(0, 5).map(h => h.type).join(', ')}`,
      config: {
        systemInstruction: "Crie planos de treinamento baseados em ciência do esporte (periodização)."
      }
    });
    return response.text ?? "Erro ao gerar plano.";
  } catch (error) {
    console.error("Plan Gen Error:", error);
    return "Não foi possível gerar seu plano agora.";
  }
};
