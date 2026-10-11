import { Easing, FadeIn, FadeOut, SlideInRight, SlideOutLeft, SlideInUp, SlideOutDown, FadeInDown } from 'react-native-reanimated';

// Tweak these based on precise UX standards
export const TIMING = {
  micro: 120, // Fast button scales
  tab: 150, // Tab fades
  list: 180, // List items
  modal: 250, // Modal sheets
  page: 250, // Screen transitions
};

// Premium Easing curve (Standard Material / Apple-like ease-out)
const premiumEasing = Easing.out(Easing.poly(4));

export const MOTION = {
  // Navigation Transitions
  pageSlideInRight: SlideInRight.duration(TIMING.page).easing(premiumEasing),
  pageSlideOutLeft: SlideOutLeft.duration(TIMING.page).easing(premiumEasing),
  pageFadeIn: FadeIn.duration(TIMING.page).easing(premiumEasing),
  pageFadeOut: FadeOut.duration(TIMING.page).easing(premiumEasing),
  
  // Tab Navigation (Subtle Fade)
  tabFadeIn: FadeIn.duration(TIMING.tab).easing(Easing.ease),
  tabFadeOut: FadeOut.duration(TIMING.tab).easing(Easing.ease),
  
  // Modals (Slide UP from bottom, no bounce)
  modalSlideUp: SlideInUp.duration(TIMING.modal).easing(premiumEasing),
  modalSlideDown: SlideOutDown.duration(TIMING.modal).easing(premiumEasing),

  // List Item Stagger (Subtle translate Y with fade)
  listStaggerFade: (index: number = 0) => 
    FadeInDown.delay(index * 50)
      .duration(TIMING.list)
      .easing(premiumEasing)
      .withInitialValues({ transform: [{ translateY: 10 }] }),
};
