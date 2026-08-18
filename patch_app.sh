sed -i '/{activeTab === '"'"'ai-design'"'"' && (/,/)}/d' src/App.tsx
sed -i '/{activeTab === '"'"'estimator'"'"' && (/,/)}/d' src/App.tsx
sed -i '/<CustomAiDesign/d' src/App.tsx
sed -i '/<ProjectEstimator/d' src/App.tsx
