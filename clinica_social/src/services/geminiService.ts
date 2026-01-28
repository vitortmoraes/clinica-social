
import { GoogleGenAI } from "@google/genai";
import { Patient, Appointment, Volunteer } from '../types';

export const getDailyBriefing = async (appointments: Appointment[], patients: Patient[], volunteers: Volunteer[]) => {
  // Fix: Initializing GoogleGenAI with named parameter and direct process.env.API_KEY reference
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const scheduleText = appointments.map(app => {
    const p = patients.find(pat => pat.id === app.patientId);
    const v = volunteers.find(vol => vol.id === app.volunteerId);
    return `- ${app.time}: ${p?.name} com ${v?.name} (${app.specialty})`;
  }).join('\n');

  const prompt = `
    Você é um assistente administrativo de uma clínica médica de caridade de uma igreja.
    Aqui está a agenda de hoje:
    ${scheduleText}

    Por favor, forneça um resumo rápido e motivador para a equipe, destacando o impacto social (baseado nas especialidades atendidas) e lembrando-os da missão de servir ao próximo. 
    Seja breve (máximo 150 palavras).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Accessing .text as a property as per GenAI SDK correct method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Bem-vindos a mais um dia de serviço! Que possamos atender a todos com amor e excelência.";
  }
};
