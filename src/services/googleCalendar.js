// src/services/googleCalendar.js
const API_KEY = "AIzaSyDxwhQ6jXXQRXQL0aVRFxG402BIbMxaczE";
const CALENDAR_ID = encodeURIComponent("uayoungin@gmail.com");

const handleApiError = (error, context) => {
  console.error(`Google Calendar Error (${context}):`, {
    message: error.message,
    error: error.response?.data || error,
  });
  throw error;
};

export const createCalendarEvent = async (event) => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}`;

  console.log("Creating calendar event:", { url, event });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.dateTime,
          timeZone: "Europe/Kiev",
        },
        end: {
          dateTime: event.end.dateTime,
          timeZone: "Europe/Kiev",
        },
        reminders: {
          useDefault: true,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create event");
    }

    console.log("Event created successfully:", data);
    return data;
  } catch (error) {
    return handleApiError(error, "createEvent");
  }
};

export const updateCalendarEvent = async (eventId, event) => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${eventId}?key=${API_KEY}`;

  console.log("Updating calendar event:", { url, eventId, event });

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to update event");
    }

    return data;
  } catch (error) {
    return handleApiError(error, "updateEvent");
  }
};

export const deleteCalendarEvent = async (eventId) => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${eventId}?key=${API_KEY}`;

  console.log("Deleting calendar event:", url);

  try {
    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to delete event");
    }

    return true;
  } catch (error) {
    return handleApiError(error, "deleteEvent");
  }
};
