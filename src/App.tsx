import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserSelection } from '@/pages/UserSelection';
import { Home } from '@/pages/Home';
import { TestSetup } from '@/pages/TestSetup';
import { Test } from '@/pages/Test';
import { Result } from '@/pages/Result';
import { Reading } from '@/pages/Reading';
import { Records } from '@/pages/Records';
import { useQuestionStore } from '@/store/questionStore';
import { useThemeStore } from '@/store/themeStore';
import '@/styles/globals.css';

function App() {
  useEffect(() => {
    useThemeStore.getState().setTheme(useThemeStore.getState().mode);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const { getQuestions } = useQuestionStore.getState();
      const primary = getQuestions('primary');
      const intermediate = getQuestions('intermediate');
      if (primary.length === 0 && intermediate.length === 0) {
        import('@/data/questionBanks').then((m) => {
          if (m.loadAllQuestionBanks) m.loadAllQuestionBanks();
        }).catch(() => {});
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserSelection />} />
        <Route path="/home" element={<Home />} />
        <Route path="/test-setup/:bank" element={<TestSetup />} />
        <Route path="/test/:bank/:mode" element={<Test />} />
        <Route path="/result" element={<Result />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/records" element={<Records />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

