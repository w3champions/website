export default class PercentageService {
    public static getPercentage(w: number, g: number) {
        return ((w * 100) / g) || 0;
    }
}