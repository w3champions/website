import { EAvatarCategory } from '@/store/typings';

export function getAvatarUrl(category: EAvatarCategory, picId: number, isClassic: boolean) {
    if (category == EAvatarCategory.SPECIAL) {
      return require(`../assets/specialAvatars/SPECIAL_${picId}.jpg`);
    }
    else {
      const raceIconPrefix = isClassic ? 'classic/' : '';
      const categoryString = EAvatarCategory[category].toString();
      return require(`../assets/raceAvatars/${raceIconPrefix}${categoryString}_${picId}.jpg`);
    }
  }