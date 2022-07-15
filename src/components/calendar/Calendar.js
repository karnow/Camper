import React, { useEffect, useState } from "react";
import { addReservation } from "../../api/booking/addReservation";
import { getReservationByCamperId } from "../../api/booking/getReservationByCamperId";
import { getReservByBorrowId } from "../../api/booking/getReservByBorrowId";
import { deleteReservation } from "../../api/booking/deleteReservation";
import DatePicker, { registerLocale } from "react-datepicker";
import pl from "date-fns/locale/pl";
import "react-datepicker/dist/react-datepicker.css";
import './calendar.css';
import "./Calendar.style.js";
import FullCalendar from "@fullcalendar/react"; // must go before plugins
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import dayGridPlugin from "@fullcalendar/daygrid";
import {
  CenteredDiv,
  StyledHeader,
  StyledWrapper,
  StyledButton,
  YourRes,
  StyledEditButton,
  StyledP,
  StyledH2,
} from "./Calendar.style.js";
import plLocale from "@fullcalendar/core/locales/pl";
import emailjs from "emailjs-com";
import { FaRegTrashAlt } from 'react-icons/fa';


registerLocale("pl", pl);

export function Calendar({ camper, user }) {
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
  });
  const [allEvents, setAllEvents] = useState([]);
  const [myReser, setmyReser] = useState([]);

  useEffect(() => {
    getReservationByCamperId(camper.id)
      .then((data) => {
        ConvertAndSendToState(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    if (user) {
      getReservByBorrowId(user.id, camper.id)
        .then((data) => {
          const newData = data.map((el) => {
            const elstart = new Date(el.start.seconds * 1000);
            const elend = new Date(el.end.seconds * 1000);
            return {
              bookid: el.id,
              borrowerid: el.borrowerid,
              title: el.title,
              start: elstart,
              end: elend,
              totalCost: el.totalCost,
            };
          });
          setmyReser(newData);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("nie jestes zalogowany");
    }
  }, [allEvents]);

  function ConvertAndSendToState(data) {
    console.log("dane z firebase:", data);
    const newData = data.map((el) => {
      const elstart = new Date(el.start.seconds * 1000);
      const elend = new Date(el.end.seconds * 1000);
      return {
        title: el.title,
        start: elstart,
        end: elend,
      };
    });
    setAllEvents(newData);
  }

  function handleAddEvent() {
    const bookingResult = rentalCost();
    console.log(bookingResult[0], bookingResult[1]);
    addReservation(newEvent, bookingResult[0], bookingResult[1]).then((res) => {
      alert(
        `Rezerwacja campera: ${camper.title} dla uzytkownika: ${
          user.email
        } w dniach od ${new Date(newEvent.start).getDate().toString()}/${
          new Date(newEvent.start).getMonth() + 1
        }/${new Date(newEvent.start).getFullYear()}  do ${new Date(newEvent.end)
          .getDate()
          .toString()}/${new Date(newEvent.end).getMonth() + 1}/${new Date(
          newEvent.end
        ).getFullYear()} w cenie: ${bookingResult[0]} zł została potwierdzona. Informacja o twojej rezerwacji zostanie wysłana na twój adres e-mail`
      );

      const start = `${new Date(newEvent.start).getDate().toString()}/${
        new Date(newEvent.start).getMonth() + 1
      }/${new Date(newEvent.start).getFullYear()}`;

      const stop = `${new Date(newEvent.end).getDate().toString()}/${
        new Date(newEvent.end).getMonth() + 1
      }/${new Date(newEvent.end).getFullYear()}`;

      emailjs.send('gmail', 'template_wysu6rx', {from_name:`${user.email}`,camper_name:`${camper.title}`, start:`${start}`,stop:`${stop}`,cena:`${bookingResult[0]}`}, 'uovqm0wbm9ul6DmnK')
      .then((result) => {
          console.log(result.text);

      }, (error) => {
          console.log(error.text);

      });

      getReservationByCamperId(camper.id)
        .then((data) => {
          ConvertAndSendToState(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
    console.log(newEvent);
  }

  function deleteReservationHandler(id) {
    deleteReservation(id)
      .then((res) => {
        getReservationByCamperId(camper.id)
          .then((data) => {
            ConvertAndSendToState(data);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((er) => console.log(er));
  }

  function rentalCost() {
    let dailyRate = camper.price;
    if (newEvent.start != null && newEvent.end != null) {
      const difference = newEvent.end - newEvent.start;
      const rentalDuration = Math.ceil(difference / (1000 * 3600 * 24));
      const totalCost = rentalDuration * dailyRate;
      return [totalCost, rentalDuration];
    }
  }

  return (
    <div className="Calendar">
      <StyledHeader>Kalendarz wypożyczeń campera</StyledHeader>
      <StyledWrapper>
        {allEvents.length > 0 ? (
          <FullCalendar
            locale={plLocale}
            plugins={[dayGridPlugin, momentTimezonePlugin]}
            timeZone="Europe/Moscow"
            displayEventTime={false}
            initialView="dayGridMonth"
            events={allEvents}
            contentHeight={450}
          />
        ) : (
          <FullCalendar
            locale={plLocale}
            plugins={[dayGridPlugin, momentTimezonePlugin]}
            timeZone="Europe/Moscow"
            displayEventTime={false}
            initialView="dayGridMonth"
            events={allEvents}
            contentHeight={450}
          />
        )}
      </StyledWrapper>
      {user && (
        <>
          <CenteredDiv>
            <CenteredDiv>
              <DatePicker
                minDate={newEvent.end || new Date}
                locale="pl"
                placeholderText="Data początkowa"
                selected={newEvent.start}
                onChange={(start) => {
                  setNewEvent({
                    ...newEvent,
                    start,
                    title: "zajęty",
                    camperid: camper.id,
                    owner: camper.useremail,
                    ownerid: camper.userid,
                    borrower: user.email,
                    borrowerid: user.id,
                  });
                }}
              />
              <DatePicker
                locale="pl"
                minDate={newEvent.start}
                placeholderText="Data końcowa"
                selected={newEvent.end}
                onChange={(end) => {
                  setNewEvent({
                    ...newEvent,
                    end,
                  });
                }}
              />
            </CenteredDiv>

            <StyledButton
              style={{
                margin: "30px",
              }}
              onClick={handleAddEvent}
            >
              Zarezerwuj campera
            </StyledButton>
          </CenteredDiv>
        </>
      )}


   
       
    
      <YourRes>
        {user && <StyledH2> Twoje rezerwacje : <hr></hr></StyledH2>}


        {user &&
          myReser &&
          myReser.map((el, index) => {
            return (
              <StyledP key={index}>
                <p class="pres">
                  rezerwacja kampera nr:{index + 1} od{" "}
                  {new Date(el.start).getDate().toString()}/
                  {new Date(el.start).getMonth() + 1}/
                  {new Date(el.start).getFullYear()} do{" "}
                  {new Date(el.end).getDate().toString()}/
                  {new Date(el.end).getMonth() + 1}/
                  {new Date(el.end).getFullYear()} w cenie: {el.totalCost} zł
                </p>
                {user.id === el.borrowerid ? (
                  <button className="deletebutton" onClick={() => deleteReservationHandler(el.bookid)}>
                    <FaRegTrashAlt /> Usuń 
                  </button>
                ) : null}
              </ StyledP>
            );
          })}
        {myReser.length === 0 && user && (
          <StyledP>Nie masz jeszcze rezerwacji tego kampera</StyledP>
        )}
     </YourRes>
    </div>
  );
}
