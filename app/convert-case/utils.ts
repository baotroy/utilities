export enum CaseType {
    Lowercase = 'lowercase',
    Uppercase = 'uppercase',
    Capitalized = 'capitalized',
    Sentence = 'sentence',
    Alternating = 'alternating',
    Title = 'title',
    Inverse = 'inverse',
}

export default function convertCase(str: string, type: CaseType): string {
    if (type === 'lowercase') return str.toLowerCase();
    if (type === 'uppercase') return str.toUpperCase();
    if (type === 'capitalized') return str.toLowerCase().split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (type === 'sentence')  return str.toLowerCase().split('.').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('.');
    if (type === 'alternating') return str.replace(/\w/g, (match, index) => index % 2 ? match.toLowerCase() : match.toUpperCase());
    if (type === 'title') return str.replace(/\w\S*/g, (match) => match.charAt(0).toUpperCase() + match.substr(1).toLowerCase());
    if (type === 'inverse') return str.replace(/\w\S*/g, (match) => match.charAt(0).toLowerCase() + match.substr(1).toUpperCase());
    return str;
}