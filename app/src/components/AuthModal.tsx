import React, { FC, useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import authService, { AuthDB } from '../api/authService';

import './AuthModal.scss';

interface AuthModalProps {
    setAuthorized: (value: boolean) => void;
}

export const AuthModal: FC<AuthModalProps> = (props) => {
    const [validated, setValidated] = useState(false);
    const [answers, setAnswers] = useState<{[key: string]: string;}>({});
    const [hasTriedTimes, setHasTriedTimes] = useState(0);

    const onChange = (key: string, value: string) => {
        setAnswers({...answers, [key]: value});
    };

    const onSubmit = () => {
        if (authService.questions.some(_q => !answers[_q.key])) {
            setValidated(true);
            return;
        }
        authService.params = answers;
        props.setAuthorized(true);
    };

    useEffect(() => {
        const init = async () => {
            setHasTriedTimes(await authService.hasTriedTimes);
        }
        init();
    }, []);

    return (
        <Modal
            show
            centered
        >
            {hasTriedTimes >= AuthDB.MAX_TRY ? (
                <>
                    <Modal.Header className='auth-modal-error'>
                        <Modal.Title>Exceed Limit</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className='auth-modal-error'>
                        {`You have tried ${AuthDB.MAX_TRY} times, plz wait ${AuthDB.RETRY_TIME_IN_HOUR} hour later and try again.`}
                    </Modal.Body>
                </>
            ) : (
                <Modal.Body>
                    <Form validated={validated} onSubmit={onSubmit}>
                        {authService.questions.map(_q => (
                            <Form.Group className="mb-3" controlId={_q.key} key={_q.key}>
                                <Form.Label>{_q.label}</Form.Label>
                                <Form.Control
                                    required
                                    type={_q.type || 'text'}
                                    placeholder={_q.placeholder}
                                    onChange={(e) => onChange(_q.key, e.target.value)}
                                />
                                <Form.Control.Feedback type='invalid'>
                                    {_q.errorMessage || 'This is required.'}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    {_q.description}
                                </Form.Text>
                            </Form.Group>
                        ))}
                    </Form>
                    <Button onClick={onSubmit}>Submit</Button>
                    {hasTriedTimes > 0 && (
                        <p style={{color: 'red'}}>
                            {`You only have ${AuthDB.MAX_TRY - hasTriedTimes} times try left`}
                        </p>
                    )}
                </Modal.Body>
            )}
        </Modal>
    )
};