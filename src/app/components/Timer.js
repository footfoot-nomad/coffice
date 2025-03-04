'use client';

import React, { useState, useEffect } from 'react';

const Timer = ({ selectedSubscription, officeInfo, selectedDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerStatus, setTimerStatus] = useState('waiting');
  const [isExactToday, setIsExactToday] = useState(false);

  useEffect(() => {
    if (!selectedSubscription || !officeInfo) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);

    const isExactToday = today.getTime() === selectedDateObj.getTime();
    setIsExactToday(isExactToday);

    if (!isExactToday) {
      setTimeLeft(null);
      return;
    }

    const dayMapping = {
      '월': 'mon_operation_office',
      '화': 'tue_operation_office',
      '수': 'wed_operation_office',
      '목': 'thu_operation_office',
      '금': 'fri_operation_office',
      '토': 'sat_operation_office',
      '일': 'sun_operation_office'
    };

    const calculateTimes = () => {
      const now = new Date();
      const operationHours = officeInfo[selectedSubscription.id_office]?.[dayMapping[selectedSubscription.day_coffice]];
      
      if (!operationHours) return null;

      const [startHour, startMinute, startSecond] = operationHours[0].split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(startHour, startMinute, startSecond);

      const [attendHour, attendMinute] = selectedSubscription.attendtime_coffice.split(':').map(Number);
      const attendTime = new Date();
      attendTime.setHours(attendHour, attendMinute, 0);
      
      const totalCountdownTime = attendTime - startTime;

      if (now < startTime) {
        setTimerStatus('waiting');
        return totalCountdownTime;
      } else if (now < attendTime) {
        setTimerStatus('counting');
        return attendTime - now;
      } else {
        setTimerStatus('ended');
        return 0;
      }
    };

    const timer = setInterval(() => {
      const remainingTime = calculateTimes();
      setTimeLeft(remainingTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSubscription, officeInfo, selectedDate]);

  const formatTime = (ms) => {
    if (!isExactToday) return { hours: '--', minutes: '--', seconds: '--' };
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return {
      hours: String(Math.max(0, hours)).padStart(2, '0'),
      minutes: String(Math.max(0, minutes)).padStart(2, '0'),
      seconds: String(Math.max(0, seconds)).padStart(2, '0')
    };
  };

  const time = formatTime(timeLeft || 0);

  return (
    <div className="flex flex-col items-start h-[11vh] w-full px-2">
      <div className="border-2 border-black bg-gray-100 rounded-lg w-full max-w-[320px] mx-auto h-[12vh]">
        <div className="flex justify-center items-center h-full">
          <span className="text-[38px] text-black">
            {`${time.hours} : ${time.minutes} : ${time.seconds}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Timer; 