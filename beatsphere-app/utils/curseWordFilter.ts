// utils/curseWordFilter.ts

const curseWords = [
    'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore'
];

export const filterCurseWords = (text: string): string => {
    let filteredText = text;
    curseWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredText = filteredText.replace(regex, '***');
    });
    return filteredText;
};