export interface TurnkeyServiceFeature {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
}

export interface TurnkeyServiceTimeline {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
}

const STORAGE_KEY_FEATURES = 'turnkey_features';
const STORAGE_KEY_TIMELINE = 'turnkey_timeline';

const INITIAL_FEATURES: TurnkeyServiceFeature[] = [
  { id: '1', title: 'Single Point of Contact', description: 'One dedicated manager handles your entire project from start to finish.', order_index: 1, is_active: true },
  { id: '2', title: 'Quality Assurance', description: 'Strict quality checks at every stage ensure flawless execution.', order_index: 2, is_active: true },
  { id: '3', title: 'Transparent Pricing', description: 'No hidden costs. Get detailed estimates before the project begins.', order_index: 3, is_active: true },
  { id: '4', title: 'On-Time Delivery', description: 'Committed timelines with regular progress updates.', order_index: 4, is_active: true }
];

const INITIAL_TIMELINE: TurnkeyServiceTimeline[] = [
  { id: '1', title: 'Initial Consultation', description: 'Understanding your requirements, space, and budget.', order_index: 1, is_active: true },
  { id: '2', title: 'Design & Planning', description: 'Creating 2D/3D designs and material selection.', order_index: 2, is_active: true },
  { id: '3', title: 'Execution', description: 'On-site work begins with regular quality checks.', order_index: 3, is_active: true },
  { id: '4', title: 'Handover', description: 'Final cleaning, inspection, and project handover.', order_index: 4, is_active: true }
];

export const turnkeyService = {
  getFeatures: async (): Promise<TurnkeyServiceFeature[]> => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FEATURES);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(INITIAL_FEATURES));
        return INITIAL_FEATURES;
      }
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_FEATURES;
    }
  },

  getTimeline: async (): Promise<TurnkeyServiceTimeline[]> => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TIMELINE);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_TIMELINE, JSON.stringify(INITIAL_TIMELINE));
        return INITIAL_TIMELINE;
      }
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_TIMELINE;
    }
  },

  updateFeature: async (feature: TurnkeyServiceFeature): Promise<void> => {
    const features = await turnkeyService.getFeatures();
    const idx = features.findIndex(f => f.id === feature.id);
    if (idx >= 0) {
      features[idx] = feature;
    } else {
      features.push(feature);
    }
    localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features));
  },

  deleteFeature: async (id: string): Promise<void> => {
    const features = await turnkeyService.getFeatures();
    localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features.filter(f => f.id !== id)));
  },

  updateTimeline: async (step: TurnkeyServiceTimeline): Promise<void> => {
    const timeline = await turnkeyService.getTimeline();
    const idx = timeline.findIndex(t => t.id === step.id);
    if (idx >= 0) {
      timeline[idx] = step;
    } else {
      timeline.push(step);
    }
    localStorage.setItem(STORAGE_KEY_TIMELINE, JSON.stringify(timeline));
  },

  deleteTimeline: async (id: string): Promise<void> => {
    const timeline = await turnkeyService.getTimeline();
    localStorage.setItem(STORAGE_KEY_TIMELINE, JSON.stringify(timeline.filter(t => t.id !== id)));
  }
};
