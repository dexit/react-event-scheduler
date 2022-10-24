import { ApolloError, NetworkStatus } from '@apollo/client';
import { ChangeEvent, FC, useContext, useEffect, useState } from 'react';
import useDebounce from '../../../hooks/useDebounce';
import Spinner from '../../../components/UI/Spinner/Spinner';
import Card, { CardType } from '../../../components/UI/Card/Card';
import Alert from '../../../components/UI/Alert/Alert';
import Pagination from '../../../components/Pagination/Pagination';
import AuthContext from '../../../store/auth-context';
import Modal from '../../../components/UI/Modal/Modal';
import EventBody, { EventType } from '../../../components/EventBody/EventBody';
import { Form } from 'react-bootstrap';
import {
  EventFull,
  useDeleteEventMutation,
  useGetEventsQuery,
  useSaveEventMutation,
} from '../../../generated/graphql';
import styled from 'styled-components';
import { dateToTitle } from '../../../utils/dateTransforms';
import { ServerErrorAlert } from '../../../components/ServerErrorAlert/ServerErrorAlert';

const EVENTS_PER_PAGE = 20;

const SearchEvents: FC = () => {
  const [modal, setModal] = useState({
    title: '',
    show: false,
  });
  const [serverError, setServerError] = useState<ApolloError | null>(null);

  const [event, setEvent] = useState<EventType>({
    id: '',
    title: '',
    start: '',
    end: '',
    isPrivate: false,
    description: '',
    createdById: '',
  });

  const [actionBtns, setActionBtns] = useState({
    displayDeleteBtn: false,
    hideSaveBtn: true,
    disableSaveBtn: false,
    disableDeleteBtn: false,
  });

  const [formProps, setFormProps] = useState({
    searchText: '',
    currentPage: 1,
    allCheck: true,
    currentCheck: false,
    expiredCheck: false,
  });

  const { auth } = useContext(AuthContext);

  const { searchText, currentPage, allCheck, currentCheck, expiredCheck } =
    formProps;
  const { id, title, start, end, isPrivate, description, createdById } = event;
  const { displayDeleteBtn, hideSaveBtn, disableSaveBtn, disableDeleteBtn } =
    actionBtns;

  const debouncedSearchText = useDebounce(searchText);

  const { loading, data, refetch, networkStatus } = useGetEventsQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: {
      filter: {
        searchText: debouncedSearchText.trim(),
        pageSize: EVENTS_PER_PAGE,
        pageNumber: currentPage,
        currentCheck,
        expiredCheck,
      },
    },
    onError: setServerError,
  });

  const [saveEvent, { loading: saveEventLoading }] = useSaveEventMutation({
    onError: setServerError,
  });

  const [deleteEvent, { loading: deleteEventLoading }] = useDeleteEventMutation(
    { onError: setServerError }
  );

  const handleOnSubmit = (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    refetch();
  };

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormProps({ ...formProps, searchText: event.target.value });
  };

  const onFinalizeApiRequest = () => {
    setActionBtns({
      ...actionBtns,
      disableDeleteBtn: false,
      disableSaveBtn: false,
    });
    setModal({ ...modal, show: false });
  };

  const getExSubTitle = (endTime: string) => {
    const today = new Date();
    const endDate = new Date(endTime);

    return endDate.getTime() < today.getTime() ? 'Expired' : '';
  };

  const clickEventHandler = (event: EventFull) => {
    const { id, title, start, end, isPrivate, description, createdBy } = event;
    const createdById = createdBy?._id ?? '';

    if (auth) {
      const equal = auth.userId === createdById;
      setActionBtns({
        ...actionBtns,
        displayDeleteBtn: equal,
        hideSaveBtn: !equal,
        disableSaveBtn: !equal,
      });
    } else {
      setActionBtns({
        ...actionBtns,
        displayDeleteBtn: false,
        hideSaveBtn: true,
      });
    }

    setEvent({
      id: id ?? '',
      title,
      start,
      end,
      description,
      isPrivate,
      createdById,
    });
    setModal({ title: 'Update Event', show: true });
  };

  const handleDeleteEvent = () => {
    setActionBtns({
      ...actionBtns,
      disableDeleteBtn: true,
      disableSaveBtn: true,
    });

    deleteEvent({
      variables: { id: id ?? '' },
    })
      .then(() => {
        resetCurrentPage();
        refetch();
      })
      .finally(onFinalizeApiRequest);
  };

  const handleSaveEvent = () => {
    setActionBtns({
      ...actionBtns,
      disableDeleteBtn: true,
      disableSaveBtn: true,
    });

    saveEvent({
      variables: {
        event: {
          id: id ?? '',
          title,
          start,
          end,
          isPrivate,
          description,
        },
      },
    })
      .then(() => refetch())
      .finally(onFinalizeApiRequest);
  };

  const resetCurrentPage = () => setFormProps({ ...formProps, currentPage: 1 });

  useEffect(() => {
    resetCurrentPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText]);

  useEffect(() => {
    resetCurrentPage();
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, refetch]);

  const handleFilterByAllEventsChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setFormProps({
      ...formProps,
      currentPage: 1,
      currentCheck: false,
      allCheck: !allCheck,
      expiredCheck: false,
    });
  };

  const handleFilterByCurrentEventsChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    e.persist();
    setFormProps({
      ...formProps,
      currentPage: 1,
      currentCheck: !currentCheck,
      allCheck: false,
      expiredCheck: false,
    });
  };

  const handleFilterByExpiredEventsChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    e.persist();
    setFormProps({
      ...formProps,
      currentPage: 1,
      currentCheck: false,
      allCheck: false,
      expiredCheck: !expiredCheck,
    });
  };

  const onChangeValueHandler = (prop: string, value: string | boolean) => {
    setEvent({ ...event, [prop]: value });
  };

  const disableEditHandler = () => {
    return auth && auth.userId === event.createdById;
  };

  const eventToCard = (event: EventFull): CardType => ({
    title: event.title,
    subtitle: dateToTitle(event),
    exSubTitle: getExSubTitle(event.end),
    content: event.description,
    url: event.url,
    createdBy: event?.createdBy?.username ?? '',
    createdAt: event.createdAt ?? 0,
    updatedAt: event.updatedAt ?? 0,
    isPrivate: event.isPrivate,
  });

  return (
    <>
      <ServerErrorAlert
        error={serverError}
        onClose={() => setServerError(null)}
      />

      <Form>
        <div className="mb-4">
          <span className="me-3 fs-5">Filter by: </span>
          <Form.Check
            inline
            label="All"
            name="group"
            type="radio"
            defaultChecked={allCheck}
            onChange={handleFilterByAllEventsChange}
          />
          <Form.Check
            inline
            label="Active"
            name="group"
            type="radio"
            defaultChecked={currentCheck}
            onChange={handleFilterByCurrentEventsChange}
          />
          <Form.Check
            inline
            label="Expired"
            name="group"
            type="radio"
            defaultChecked={expiredCheck}
            onChange={handleFilterByExpiredEventsChange}
          />
        </div>
      </Form>

      <form
        className="d-flex"
        onSubmit={handleOnSubmit}
        data-testid="SearchBoxForm"
      >
        <input
          value={searchText}
          data-testid="SearchBoxInput"
          className="form-control"
          type="search"
          placeholder="Search events by title"
          aria-label="Search"
          onChange={handleOnChange}
        />
      </form>

      <EventCardContainer>
        {loading || networkStatus === NetworkStatus.refetch ? (
          <Spinner />
        ) : data?.eventsData?.events?.length ? (
          data.eventsData.events.map((event) => {
            return (
              <EventCardWrapper key={event.id}>
                <Card
                  card={eventToCard(event)}
                  onClick={() => clickEventHandler(event)}
                />
              </EventCardWrapper>
            );
          })
        ) : !serverError ? (
          <div className="event-card">
            <Alert
              msg="No results were found."
              type="warning"
              dismissible={false}
            />
          </div>
        ) : null}
      </EventCardContainer>

      {!loading && (
        <div className="float-end">
          <Pagination
            total={data?.eventsData?.totalCount || 0}
            itemsPerPage={EVENTS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={(page) =>
              setFormProps({ ...formProps, currentPage: page })
            }
          />
        </div>
      )}

      <Modal
        title={modal.title}
        show={modal.show}
        actionBtnFlags={{
          disableSubmitBtn: disableSaveBtn,
          hideSubmitBtn: hideSaveBtn,
          displayDeleteBtn,
          disableDeleteBtn,
          closeBtnName: auth?.userId === createdById ? 'Cancel' : 'Close',
        }}
        actionBtnLoading={{
          isSubmitLoading: saveEventLoading,
          isDeleteLoading: deleteEventLoading,
        }}
        onClose={() => setModal({ ...modal, show: false })}
        onDelete={handleDeleteEvent}
        onSubmit={handleSaveEvent}
        children={
          <EventBody
            event={event}
            disableEdit={!disableEditHandler()}
            onChangeValue={(prop, value) => onChangeValueHandler(prop, value)}
            onValidate={(valid) =>
              setActionBtns({ ...actionBtns, disableSaveBtn: !valid })
            }
          />
        }
      />
    </>
  );
};

export const EventCardContainer = styled.div({
  paddingTop: 10,
  paddingBottom: 20,
});

export const EventCardWrapper = styled.div({
  paddingTop: 20,
});

export default SearchEvents;
