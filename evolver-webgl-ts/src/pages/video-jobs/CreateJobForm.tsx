import * as React from "react";
import { VideoJobConfiguration } from "../../server/model";
import { Modal, Button, FormGroup, FormLabel, FormControl, Row, Form, Col, FormCheck } from "react-bootstrap";
import { TextInput } from "../../components/form/TextInput";
import { BrushSet } from "../../engine/brushSet";
import { Checkbox } from "../../components/form/Checkbox";
import { FormFields } from "../../components/form/FormFields";

interface CreateJobFormProps {
    show: boolean;
    onCancel: () => void;
    onConfirm: (name: string, configuration: VideoJobConfiguration) => void;
}

export const CreateJobForm: React.FC<CreateJobFormProps> = props => {

    const defaultFormData = (): FormFields => {
        const result = {
            name: "New Video Job",
            resolutionX: "1080",
            resolutionY: "720",
            outputFPS: "30",
            duration: "60"
        };
        return result;
    }

    const [formData, setFormData] = React.useState<{ [key: string]: string }>(defaultFormData());


    const onCancel = () => {
        setFormData(defaultFormData());
        props.onCancel();
    };

    const textInput = (field: string) => (
        <TextInput
            formData={formData}
            field={field}
            onChange={setFormData} />
    );

    const checkbox = (field: string, label: string) => (
        <Checkbox
            field={field}
            label={label}
            formData={formData}
            onChange={setFormData} />
    );

    const onCreate = () => {
        const name = formData["name"];
        const configuration: VideoJobConfiguration = {
            resolutionX: parseInt(formData["resolutionX"]),
            resolutionY: parseInt(formData["resolutionY"]),
            outputFPS: parseInt(formData["outputFPS"]),
            duration: parseInt(formData["duration"])
        };
        props.onConfirm(name, configuration);
        setFormData(defaultFormData());
    };

    return (
        <Modal size="lg" show={props.show} onHide={onCancel}>
            <Modal.Header closeButton><h4>Create New Video Job</h4></Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group as={Row}>
                        <Form.Label column className="col-sm-3">Name:</Form.Label>
                        <Col sm="7">
                            {textInput("name")}
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column className="col-sm-3">Frame Duration (minutes * 100 FPS):</Form.Label>
                        <Col sm="3">
                            {textInput("duration")}
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column className="col-sm-3">Resolution:</Form.Label>
                        <Col sm="3">
                            {textInput("resolutionX")}
                        </Col>
                        <Col sm="1" style={{ marginTop: "5px" }}>
                            <i className="fa fa-times"></i>
                        </Col>
                        <Col sm="3">
                            {textInput("resolutionY")}
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column className="col-sm-3">Output FPS:</Form.Label>
                        <Col sm="3">
                            {textInput("outputFPS")}
                        </Col>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onCreate}>
                    Create
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
