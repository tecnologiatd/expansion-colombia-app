export interface Notification {
    id: string;
    title: string;
    body: string;
    route?: string;
    date: Date;
    read: boolean;
}

export interface NotificationStore {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
}
