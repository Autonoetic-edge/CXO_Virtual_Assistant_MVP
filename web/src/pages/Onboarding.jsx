import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Sun, Moon, Clock, Calendar, Coffee, Brain, Heart, Sparkles,
  ChevronRight, ChevronLeft, Check, Plus, X, Zap
} from 'lucide-react';
import { onboardingService } from '../services/onboardingService';

const STEPS = [
  { id: 0, title: 'Welcome', icon: Sparkles },
  { id: 1, title: 'Daily Routine', icon: Clock },
  { id: 2, title: 'Habits', icon: Zap },
  { id: 3, title: 'Important Dates', icon: Calendar },
  { id: 4, title: 'Preferences', icon: Brain },
  { id: 5, title: 'All Set!', icon: Check },
];

const HABITS_OPTIONS = [
  { id: 'exercise', label: 'Exercise', emoji: '🏃' },
  { id: 'meditation', label: 'Meditation', emoji: '🧘' },
  { id: 'reading', label: 'Reading', emoji: '📚' },
  { id: 'water', label: 'Drink Water', emoji: '💧' },
  { id: 'sleep', label: 'Sleep Schedule', emoji: '😴' },
  { id: 'journaling', label: 'Journaling', emoji: '📝' },
  { id: 'learning', label: 'Learning', emoji: '🎓' },
  { id: 'nutrition', label: 'Healthy Eating', emoji: '🥗' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    wake_up_time: '07:00',
    sleep_time: '23:00',
    work_start_time: '09:00',
    work_end_time: '18:00',
    break_schedule: {
      morning: '10:30',
      lunch: '13:00',
      evening: '16:00',
    },
    habits_to_track: [],
    habit_reminder_frequency: 'daily',
    important_dates: [],
    communication_tone: 'professional',
    productivity_style: 'balanced',
    preferred_briefing_detail: 'detailed',
    motivation_style: 'encouraging',
  });

  const [newDate, setNewDate] = useState({ type: 'birthday', name: '', date: '' });

  useEffect(() => {
    loadOnboarding();
  }, []);

  const loadOnboarding = async () => {
    try {
      const response = await onboardingService.getOnboarding();
      if (response.data) {
        if (response.data.onboarding_completed) {
          navigate('/dashboard');
          return;
        }
        setFormData({
          ...formData,
          ...response.data,
          habits_to_track: response.data.habits_to_track || [],
          important_dates: response.data.important_dates || [],
          break_schedule: response.data.break_schedule || formData.break_schedule,
        });
        setCurrentStep(response.data.onboarding_step || 0);
      }
    } catch (error) {
      console.error('Failed to load onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveStep = async () => {
    setSaving(true);
    try {
      await onboardingService.updateStep(currentStep, formData);
    } catch (error) {
      console.error('Failed to save step:', error);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async () => {
    await saveStep();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      await onboardingService.completeOnboarding();
      toast.success('Welcome aboard! Your assistant is ready.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to complete setup');
    } finally {
      setSaving(false);
    }
  };

  const toggleHabit = (habitId) => {
    setFormData({
      ...formData,
      habits_to_track: formData.habits_to_track.includes(habitId)
        ? formData.habits_to_track.filter((h) => h !== habitId)
        : [...formData.habits_to_track, habitId],
    });
  };

  const addImportantDate = () => {
    if (!newDate.name || !newDate.date) {
      toast.error('Please fill in both name and date');
      return;
    }
    setFormData({
      ...formData,
      important_dates: [...formData.important_dates, { ...newDate }],
    });
    setNewDate({ type: 'birthday', name: '', date: '' });
  };

  const removeDate = (index) => {
    setFormData({
      ...formData,
      important_dates: formData.important_dates.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800">Welcome to Your Personal Assistant!</h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Let's set up your assistant to work perfectly for you. This will only take a few minutes.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles size={20} />
              <span className="font-medium">Personalized just for you</span>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">Tell me about your day</h2>
            <p className="text-gray-600 text-center">When do you typically start and end your day?</p>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sun className="text-orange-500" />
                  <span className="font-medium">Wake Up</span>
                </div>
                <input
                  type="time"
                  value={formData.wake_up_time}
                  onChange={(e) => setFormData({ ...formData, wake_up_time: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg text-lg"
                />
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="text-indigo-500" />
                  <span className="font-medium">Sleep Time</span>
                </div>
                <input
                  type="time"
                  value={formData.sleep_time}
                  onChange={(e) => setFormData({ ...formData, sleep_time: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg text-lg"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-gray-500" />
                <span className="font-medium">Work Hours</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Start</label>
                  <input
                    type="time"
                    value={formData.work_start_time}
                    onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">End</label>
                  <input
                    type="time"
                    value={formData.work_end_time}
                    onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="text-gray-500" />
                <span className="font-medium">Break Schedule</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Morning</label>
                  <input
                    type="time"
                    value={formData.break_schedule.morning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        break_schedule: { ...formData.break_schedule, morning: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Lunch</label>
                  <input
                    type="time"
                    value={formData.break_schedule.lunch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        break_schedule: { ...formData.break_schedule, lunch: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Evening</label>
                  <input
                    type="time"
                    value={formData.break_schedule.evening}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        break_schedule: { ...formData.break_schedule, evening: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">What habits do you want to track?</h2>
            <p className="text-gray-600 text-center">Select the habits you'd like help maintaining</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HABITS_OPTIONS.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.habits_to_track.includes(habit.id)
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{habit.emoji}</div>
                  <div className="font-medium">{habit.label}</div>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How often should I remind you?
              </label>
              <select
                value={formData.habit_reminder_frequency}
                onChange={(e) => setFormData({ ...formData, habit_reminder_frequency: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays only</option>
                <option value="custom">Custom schedule</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">Important Dates to Remember</h2>
            <p className="text-gray-600 text-center">Add birthdays, anniversaries, or any special dates</p>

            <div className="bg-gray-50 p-6 rounded-xl space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Type</label>
                  <select
                    value={newDate.type}
                    onChange={(e) => setNewDate({ ...newDate, type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="birthday">Birthday 🎂</option>
                    <option value="anniversary">Anniversary 💍</option>
                    <option value="renewal">Renewal 📋</option>
                    <option value="other">Other 📌</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Name/Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Mom's birthday"
                    value={newDate.name}
                    onChange={(e) => setNewDate({ ...newDate, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Date</label>
                  <input
                    type="date"
                    value={newDate.date}
                    onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={addImportantDate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
              >
                <Plus size={16} />
                Add Date
              </button>
            </div>

            {formData.important_dates.length > 0 && (
              <div className="space-y-2">
                {formData.important_dates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {date.type === 'birthday' ? '🎂' : date.type === 'anniversary' ? '💍' : date.type === 'renewal' ? '📋' : '📌'}
                      </span>
                      <div>
                        <div className="font-medium">{date.name}</div>
                        <div className="text-sm text-gray-500">{new Date(date.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDate(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">How should I communicate with you?</h2>
            <p className="text-gray-600 text-center">Personalize how your assistant interacts with you</p>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block font-medium text-gray-700 mb-3">Communication Tone</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['casual', 'professional', 'friendly', 'formal'].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setFormData({ ...formData, communication_tone: tone })}
                      className={`p-3 rounded-lg border-2 capitalize transition ${
                        formData.communication_tone === tone
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block font-medium text-gray-700 mb-3">Productivity Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'focused', label: 'Focused', desc: 'Deep work blocks' },
                    { id: 'balanced', label: 'Balanced', desc: 'Mix of work & breaks' },
                    { id: 'flexible', label: 'Flexible', desc: 'Adapt as needed' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setFormData({ ...formData, productivity_style: style.id })}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        formData.productivity_style === style.id
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-500">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block font-medium text-gray-700 mb-3">Motivation Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'direct', label: 'Direct', emoji: '🎯' },
                    { id: 'encouraging', label: 'Encouraging', emoji: '💪' },
                    { id: 'data-driven', label: 'Data-driven', emoji: '📊' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setFormData({ ...formData, motivation_style: style.id })}
                      className={`p-4 rounded-lg border-2 transition ${
                        formData.motivation_style === style.id
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{style.emoji}</div>
                      <div className="font-medium">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block font-medium text-gray-700 mb-3">Briefing Detail Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['brief', 'detailed', 'comprehensive'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, preferred_briefing_detail: level })}
                      className={`p-3 rounded-lg border-2 capitalize transition ${
                        formData.preferred_briefing_detail === level
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold text-gray-800">You're All Set!</h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Your personal assistant is now configured and ready to help you stay productive.
            </p>
            <div className="bg-gray-50 p-6 rounded-xl text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Check size={18} />
                <span>Daily schedule configured</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check size={18} />
                <span>{formData.habits_to_track.length} habits to track</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check size={18} />
                <span>{formData.important_dates.length} important dates saved</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check size={18} />
                <span>Communication preferences set</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStep ? <Check size={18} /> : <step.icon size={18} />}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-3xl">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-lg py-4 px-6">
        <div className="max-w-3xl mx-auto flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={20} />
            Back
          </button>

          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={completeOnboarding}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition font-medium"
            >
              {saving ? 'Setting up...' : 'Get Started'}
              <Sparkles size={20} />
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition font-medium"
            >
              {saving ? 'Saving...' : 'Continue'}
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
