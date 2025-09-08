import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from './useAdminAccess';

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'churn_prediction' | 'revenue_forecast' | 'compliance_risk' | 'growth_projection';
  description: string;
  accuracy: number;
  last_trained: string;
  status: 'active' | 'training' | 'inactive';
  input_features: string[];
  predictions_count: number;
}

export interface Prediction {
  id: string;
  model_id: string;
  model_name: string;
  target_id: string; // user_id, entity_id, etc.
  target_type: 'user' | 'entity' | 'revenue' | 'system';
  prediction_type: string;
  prediction_value: number;
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  metadata: Record<string, any>;
  recommendations: string[];
}

export interface BusinessInsight {
  id: string;
  category: 'user_behavior' | 'revenue_trends' | 'operational_efficiency' | 'market_analysis';
  title: string;
  description: string;
  impact_score: number;
  confidence: number;
  trend: 'positive' | 'negative' | 'neutral';
  time_period: string;
  data_points: Array<{
    metric: string;
    current_value: number;
    previous_value: number;
    change_percentage: number;
  }>;
  actionable_items: string[];
  created_at: string;
}

export const usePredictiveAnalytics = () => {
  const { isAdmin } = useAdminAccess();
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch real user and entity data for analysis
      const { data: users } = await supabase.from('profiles').select('*').limit(100);
      const { data: entities } = await supabase.from('entities').select('*').limit(100);
      const { data: payments } = await supabase.from('payments').select('*').limit(100);

      // Mock predictive models
      const mockModels: PredictiveModel[] = [
        {
          id: 'model_churn',
          name: 'Customer Churn Predictor',
          type: 'churn_prediction',
          description: 'Predicts likelihood of customer churn based on usage patterns and payment history',
          accuracy: 87.5,
          last_trained: '2024-01-07T10:00:00Z',
          status: 'active',
          input_features: ['last_login_days', 'payment_failures', 'support_tickets', 'entity_count'],
          predictions_count: 2847,
        },
        {
          id: 'model_revenue',
          name: 'Revenue Forecaster',
          type: 'revenue_forecast',
          description: 'Forecasts monthly recurring revenue based on subscription trends and market factors',
          accuracy: 92.3,
          last_trained: '2024-01-06T14:30:00Z',
          status: 'active',
          input_features: ['subscriber_growth', 'churn_rate', 'upsell_rate', 'market_seasonality'],
          predictions_count: 156,
        },
        {
          id: 'model_compliance',
          name: 'Compliance Risk Analyzer',
          type: 'compliance_risk',
          description: 'Identifies entities at risk of compliance violations based on filing patterns',
          accuracy: 83.7,
          last_trained: '2024-01-05T16:20:00Z',
          status: 'active',
          input_features: ['filing_history', 'state_regulations', 'entity_age', 'agent_performance'],
          predictions_count: 892,
        },
        {
          id: 'model_growth',
          name: 'Business Growth Projector',
          type: 'growth_projection',
          description: 'Projects business growth opportunities and market expansion potential',
          accuracy: 79.1,
          last_trained: '2024-01-04T09:15:00Z',
          status: 'training',
          input_features: ['user_acquisition', 'market_penetration', 'competitive_analysis', 'economic_indicators'],
          predictions_count: 234,
        },
      ];

      // Generate mock predictions based on real data patterns
      const mockPredictions: Prediction[] = [
        {
          id: 'pred_1',
          model_id: 'model_churn',
          model_name: 'Customer Churn Predictor',
          target_id: 'user_123',
          target_type: 'user',
          prediction_type: 'churn_probability',
          prediction_value: 0.73,
          confidence_score: 0.89,
          risk_level: 'high',
          created_at: '2024-01-08T10:30:00Z',
          metadata: {
            last_login: '2023-12-15T09:20:00Z',
            payment_failures: 2,
            support_tickets: 5,
            entity_count: 1,
          },
          recommendations: [
            'Reach out with personalized retention offer',
            'Schedule customer success call',
            'Offer free compliance consultation',
          ],
        },
        {
          id: 'pred_2',
          model_id: 'model_revenue',
          model_name: 'Revenue Forecaster',
          target_id: 'system',
          target_type: 'system',
          prediction_type: 'mrr_forecast',
          prediction_value: 389500,
          confidence_score: 0.94,
          risk_level: 'low',
          created_at: '2024-01-08T11:15:00Z',
          metadata: {
            period: 'February 2024',
            growth_factors: ['seasonal_uptick', 'new_features', 'marketing_campaign'],
          },
          recommendations: [
            'Increase marketing spend during projected growth period',
            'Prepare customer support for higher volume',
            'Plan feature releases around growth trajectory',
          ],
        },
        {
          id: 'pred_3',
          model_id: 'model_compliance',
          model_name: 'Compliance Risk Analyzer',
          target_id: 'entity_456',
          target_type: 'entity',
          prediction_type: 'compliance_risk',
          prediction_value: 0.68,
          confidence_score: 0.76,
          risk_level: 'medium',
          created_at: '2024-01-08T12:00:00Z',
          metadata: {
            entity_name: 'Delaware Tech LLC',
            missed_filings: 1,
            upcoming_deadlines: 2,
            agent_response_time: 'slow',
          },
          recommendations: [
            'Schedule proactive compliance review',
            'Assign dedicated compliance manager',
            'Set up automated deadline reminders',
          ],
        },
      ];

      // Generate business insights
      const mockInsights: BusinessInsight[] = [
        {
          id: 'insight_1',
          category: 'user_behavior',
          title: 'Entity Owners Show 25% Higher Retention',
          description: 'Users with multiple entities demonstrate significantly higher platform engagement and lower churn rates',
          impact_score: 8.7,
          confidence: 0.92,
          trend: 'positive',
          time_period: 'Last 90 days',
          data_points: [
            {
              metric: 'Retention Rate',
              current_value: 94.2,
              previous_value: 89.1,
              change_percentage: 5.7,
            },
            {
              metric: 'Avg Session Duration',
              current_value: 18.5,
              previous_value: 14.2,
              change_percentage: 30.3,
            },
          ],
          actionable_items: [
            'Encourage single-entity users to form additional entities',
            'Create multi-entity management tools and workflows',
            'Offer bulk discounts for multiple entity formations',
          ],
          created_at: '2024-01-08T09:30:00Z',
        },
        {
          id: 'insight_2',
          category: 'revenue_trends',
          title: 'Delaware Formations Drive 40% of Premium Upgrades',
          description: 'Users forming Delaware entities are significantly more likely to upgrade to premium plans within 30 days',
          impact_score: 9.1,
          confidence: 0.87,
          trend: 'positive',
          time_period: 'Last 6 months',
          data_points: [
            {
              metric: 'Upgrade Rate',
              current_value: 42.3,
              previous_value: 28.1,
              change_percentage: 50.5,
            },
            {
              metric: 'Revenue per Delaware User',
              current_value: 485,
              previous_value: 312,
              change_percentage: 55.4,
            },
          ],
          actionable_items: [
            'Promote Delaware formation benefits in marketing',
            'Create Delaware-specific onboarding flow',
            'Offer Delaware formation + premium bundle packages',
          ],
          created_at: '2024-01-08T08:45:00Z',
        },
        {
          id: 'insight_3',
          category: 'operational_efficiency',
          title: 'Agent Response Time Correlates with Customer Satisfaction',
          description: 'Every hour reduction in agent response time increases customer satisfaction scores by 12%',
          impact_score: 7.8,
          confidence: 0.81,
          trend: 'neutral',
          time_period: 'Last 3 months',
          data_points: [
            {
              metric: 'Avg Response Time (hours)',
              current_value: 4.2,
              previous_value: 6.8,
              change_percentage: -38.2,
            },
            {
              metric: 'Customer Satisfaction',
              current_value: 4.6,
              previous_value: 4.1,
              change_percentage: 12.2,
            },
          ],
          actionable_items: [
            'Implement SLA targets for agent response times',
            'Add real-time agent workload balancing',
            'Create automated response acknowledgments',
          ],
          created_at: '2024-01-07T16:20:00Z',
        },
      ];

      setModels(mockModels);
      setPredictions(mockPredictions);
      setInsights(mockInsights);
    } catch (err) {
      console.error('Error fetching predictive analytics data:', err);
      setError('Failed to fetch predictive analytics data');
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async (modelId: string) => {
    try {
      setModels(prev =>
        prev.map(model =>
          model.id === modelId
            ? {
                ...model,
                status: 'training' as const,
                last_trained: new Date().toISOString(),
              }
            : model
        )
      );

      // Simulate training time
      setTimeout(() => {
        setModels(prev =>
          prev.map(model =>
            model.id === modelId
              ? {
                  ...model,
                  status: 'active' as const,
                  accuracy: Math.min(95, model.accuracy + Math.random() * 5),
                  predictions_count: model.predictions_count + Math.floor(Math.random() * 100),
                }
              : model
          )
        );
      }, 5000);
    } catch (err) {
      console.error('Error training model:', err);
      throw new Error('Failed to train model');
    }
  };

  const generatePrediction = async (modelId: string, targetId: string) => {
    try {
      const model = models.find(m => m.id === modelId);
      if (!model) throw new Error('Model not found');

      const newPrediction: Prediction = {
        id: `pred_${Date.now()}`,
        model_id: modelId,
        model_name: model.name,
        target_id: targetId,
        target_type: 'user',
        prediction_type: model.type.replace('_prediction', '').replace('_forecast', ''),
        prediction_value: Math.random(),
        confidence_score: 0.7 + Math.random() * 0.3,
        risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        created_at: new Date().toISOString(),
        metadata: {},
        recommendations: [
          'Review target metrics regularly',
          'Implement preventive measures',
          'Monitor trends closely',
        ],
      };

      setPredictions(prev => [newPrediction, ...prev]);
      return newPrediction.id;
    } catch (err) {
      console.error('Error generating prediction:', err);
      throw new Error('Failed to generate prediction');
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [isAdmin]);

  return {
    models,
    predictions,
    insights,
    loading,
    error,
    trainModel,
    generatePrediction,
    refetch: fetchAnalyticsData,
  };
};