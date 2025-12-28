// utils/curseWordFilter.ts

const curseWords = [
    'fuck', 'bitch', 'cunt', 'dick', 'pussy', 
    'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore', 'cock'
];

/**
 * Replaces curse words in a string with '***'.
 * It matches whole words only (case-insensitive).
 * @param text The input string to filter.
 * @returns The filtered string.
 */
export const filterCurseWords = (text: string): string => {
    let filteredText = text;
    curseWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredText = filteredText.replace(regex, '***');
    });
    return filteredText;
};
