import type React from 'react';

export type ComparisonTopic = {
    id: string;
    title: string;
    description: React.ReactNode;
    leftLines: number[];
    rightLines: number[];
};
