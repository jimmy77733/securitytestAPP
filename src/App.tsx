import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserSelection } from '@/pages/UserSelection';
import { Home } from '@/pages/Home';
import { TestSetup } from '@/pages/TestSetup';
import { Test } from '@/pages/Test';
import { Result } from '@/pages/Result';
import { Reading } from '@/pages/Reading';
import { Records } from '@/pages/Records';
import '@/styles/globals.css';

function App() {
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

