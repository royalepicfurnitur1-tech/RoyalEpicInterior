import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ProjectStageNotification {
  id: string;
  projectId: string;
  projectName: string;
  previousStage: string;
  newStage: string;
  stageNumber: number;
  totalStages: number;
  completionPercent: number;
  timestamp: string;
  read: boolean;
  message: string;
  category: 'stage_change' | 'milestone_completed' | 'qa_approval' | 'dispatched';
}

interface NotificationContextType {
  notifications: ProjectStageNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notif: Omit<ProjectStageNotification, 'id' | 'timestamp' | 'read'>) => void;
  simulateStageAdvancement: (customStageName?: string, percent?: number) => void;
  toastAlert: ProjectStageNotification | null;
  clearToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: ProjectStageNotification[] = [
  {
    id: 'notif-1',
    projectId: 'RE-PROJ-8812',
    projectName: 'Villa Horizon Luxury Interior Architecture',
    previousStage: 'Phase 2: 3D Design & Material Selection',
    newStage: 'Phase 3: Factory Precision Production',
    stageNumber: 3,
    totalStages: 5,
    completionPercent: 75,
    timestamp: 'Just now',
    read: false,
    message: 'Your project status card moved to Stage 3: Factory Precision Production (75% complete). Precision Homag CNC cutting underway.',
    category: 'stage_change'
  },
  {
    id: 'notif-2',
    projectId: 'RE-PROJ-8812',
    projectName: 'Villa Horizon Luxury Interior Architecture',
    previousStage: 'Phase 1: Site Survey',
    newStage: 'Phase 2: 3D Design & Material Selection',
    stageNumber: 2,
    totalStages: 5,
    completionPercent: 40,
    timestamp: '2 hours ago',
    read: false,
    message: 'Phase 2 4K Renders & Material Sample Box approved by Lead Architect Sanya Malhotra.',
    category: 'milestone_completed'
  }
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ProjectStageNotification[]>(() => {
    try {
      const saved = localStorage.getItem('royal_epic_project_notifs');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch (e) {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [toastAlert, setToastAlert] = useState<ProjectStageNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('royal_epic_project_notifs', JSON.stringify(notifications));
    } catch (e) {
      // storage error fallback
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearToast = () => {
    setToastAlert(null);
  };

  const addNotification = (notif: Omit<ProjectStageNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: ProjectStageNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setToastAlert(newNotif);

    // Auto clear toast after 6s
    setTimeout(() => {
      setToastAlert((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 6000);
  };

  const simulateStageAdvancement = (customStageName?: string, percent?: number) => {
    const stagesList = [
      { name: 'Phase 1: Site Measurement & Survey', pct: 20 },
      { name: 'Phase 2: 3D Design & Material Selection', pct: 40 },
      { name: 'Phase 3: Factory Precision Production', pct: 75 },
      { name: 'Phase 4: Quality Control & Packaging', pct: 90 },
      { name: 'Phase 5: On-Site Assembly & Handover', pct: 100 },
    ];

    const currentTop = notifications[0];
    const currentStageNum = currentTop ? Math.min(currentTop.stageNumber + 1, 5) : 3;
    const stageInfo = stagesList[currentStageNum - 1];

    const newStageName = customStageName || stageInfo.name;
    const newPct = percent || stageInfo.pct;
    const prevStageName = currentTop?.newStage || 'Phase 2: 3D Design & Material Selection';

    addNotification({
      projectId: 'RE-PROJ-8812',
      projectName: 'Villa Horizon Luxury Interior Architecture',
      previousStage: prevStageName,
      newStage: newStageName,
      stageNumber: currentStageNum,
      totalStages: 5,
      completionPercent: newPct,
      message: `⚡ REAL-TIME ALERT: Your project status card has moved to "${newStageName}" (${newPct}% completed).`,
      category: newPct === 100 ? 'dispatched' : 'stage_change'
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        addNotification,
        simulateStageAdvancement,
        toastAlert,
        clearToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
