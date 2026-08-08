import React, { useEffect, useState } from "react";
import {
    Col,
    Row,
    Card,
    Avatar,
    Spin,
    Button,
    Tooltip,
    Space,
    Typography,
    Divider,
    Tag,
    Progress,
    List,
    Tabs,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Upload,
    message,
    InputNumber,
    Collapse
} from "antd";
import {
    Layout,
    HeaderTitle,
} from "~/components";
import {
    EditOutlined,
    MailOutlined,
    PhoneOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    UserOutlined,
    BookOutlined,
    BriefcaseOutlined,
    TrophyOutlined,
    SafetyCertificateOutlined,
    PlusOutlined,
    UploadOutlined,
    DeleteOutlined,
    SaveOutlined
} from "@ant-design/icons";
import { useProfileStore } from "~/states/profileState";
import { useProfile } from "~/hooks";
import shallow from "zustand/shallow";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

const ProfilePage = () => {
    const [
        setVisibleDepartment,
        createNewDepartment,
        setVisibleThesis,
        setSubmit,
        setClear,
        visibleThesis,
        createNewThesis,
    ] = useProfileStore(
        (state) => [
            state.setVisibleDepartment,
            state.createNewDepartment,
            state.setVisibleThesis,
            state.setSubmit,
            state.setClear,
            state.visibleThesis,
            state.createNewThesis,
        ],
        shallow
    );

    const {
        isLoading,
        data: profile,
        isFetching,
    } = useProfile();

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [activeForm, setActiveForm] = useState('personal');
    const [personalForm] = Form.useForm();
    const [skillsForm] = Form.useForm();
    const [educationForm] = Form.useForm();
    const [experienceForm] = Form.useForm();
    const [certificationForm] = Form.useForm();
    const [projectForm] = Form.useForm();

    // Sample data for demonstration
    const [expertiseData, setExpertiseData] = useState([
        { id: 1, skill: 'ReactJS', proficiency: 90 },
        { id: 2, skill: 'JavaScript', proficiency: 85 },
        { id: 3, skill: 'UI/UX Design', proficiency: 80 },
        { id: 4, skill: 'Node.js', proficiency: 75 },
        { id: 5, skill: 'Database Management', proficiency: 70 },
    ]);

    const [educationData, setEducationData] = useState([
        {
            id: 1,
            degree: 'PhD in Computer Science',
            institution: 'University of Technology',
            year: '2018-2022',
            description: 'Specialized in Artificial Intelligence and Machine Learning'
        },
        {
            id: 2,
            degree: 'MSc in Software Engineering',
            institution: 'State University',
            year: '2015-2017',
            description: 'Thesis on Distributed Systems Architecture'
        },
        {
            id: 3,
            degree: 'BSc in Computer Engineering',
            institution: 'City College',
            year: '2011-2015',
            description: 'Graduated with Honors'
        }
    ]);

    const [experienceData, setExperienceData] = useState([
        {
            id: 1,
            position: 'Senior Software Engineer',
            company: 'Tech Solutions Inc.',
            duration: '2020-Present',
            description: 'Leading frontend development team, architecting scalable solutions'
        },
        {
            id: 2,
            position: 'Software Developer',
            company: 'Web Innovations LLC',
            duration: '2017-2020',
            description: 'Developed responsive web applications using React and Node.js'
        },
        {
            id: 3,
            position: 'Junior Developer',
            company: 'StartUp Co.',
            duration: '2015-2017',
            description: 'Built and maintained company website and internal tools'
        }
    ]);

    const [certificationsData, setCertificationsData] = useState([
        { id: 1, name: 'AWS Certified Solutions Architect', year: '2021' },
        { id: 2, name: 'Google Cloud Professional Developer', year: '2020' },
        { id: 3, name: 'React Native Certification', year: '2019' }
    ]);

    const [projectsData, setProjectsData] = useState([
        {
            id: 1,
            name: 'E-commerce Platform',
            description: 'Led development of a full-stack e-commerce solution serving over 10,000 users. Implemented responsive UI with React, Redux for state management, and Node.js backend with MongoDB.',
            technologies: ['React', 'Node.js', 'MongoDB', 'Stripe API']
        },
        {
            id: 2,
            name: 'Task Management App',
            description: 'Designed and developed a collaborative task management application with real-time updates using Socket.io, React frontend, and Express backend.',
            technologies: ['React', 'Socket.io', 'Express', 'PostgreSQL']
        },
        {
            id: 3,
            name: 'University Research Portal',
            description: 'Created a research paper management system for university professors and students to submit, review, and publish academic papers.',
            technologies: ['React', 'Django', 'MySQL', 'AWS S3']
        }
    ]);

    const [languagesData, setLanguagesData] = useState([
        { id: 1, language: 'English', proficiency: 100, level: 'Native' },
        { id: 2, language: 'Spanish', proficiency: 80, level: 'Fluent' },
        { id: 3, language: 'French', proficiency: 60, level: 'Intermediate' }
    ]);

    const showEditModal = (formType) => {
        setActiveForm(formType);
        setIsEditModalVisible(true);
        
        // Pre-fill form with existing data based on form type
        if (formType === 'personal') {
            personalForm.setFieldsValue({
                fname: profile?.fname || '',
                mname: profile?.mname || '',
                lname: profile?.lname || '',
                email: profile?.email || '',
                phone: '+1 (555) 123-4567',
                website: 'https://personal-website.com',
                location: 'San Francisco, CA',
                title: 'Senior Software Engineer',
                summary: 'Experienced software engineer with over 8 years of expertise in developing scalable web applications using modern JavaScript frameworks.'
            });
        }
    };

    const handleEditOk = () => {
        // Validate and submit based on active form
        if (activeForm === 'personal') {
            personalForm.validateFields()
                .then(values => {
                    console.log('Personal info:', values);
                    message.success('Personal information updated successfully');
                    setIsEditModalVisible(false);
                })
                .catch(info => {
                    console.log('Validate Failed:', info);
                });
        } else if (activeForm === 'skill') {
            skillsForm.validateFields()
                .then(values => {
                    console.log('Skill info:', values);
                    const newSkill = {
                        id: expertiseData.length + 1,
                        skill: values.skill,
                        proficiency: values.proficiency
                    };
                    setExpertiseData([...expertiseData, newSkill]);
                    message.success('Skill added successfully');
                    setIsEditModalVisible(false);
                    skillsForm.resetFields();
                })
                .catch(info => {
                    console.log('Validate Failed:', info);
                });
        } else if (activeForm === 'education') {
            educationForm.validateFields()
                .then(values => {
                    console.log('Education info:', values);
                    const newEducation = {
                        id: educationData.length + 1,
                        degree: values.degree,
                        institution: values.institution,
                        year: `${values.startYear} - ${values.endYear}`,
                        description: values.description
                    };
                    setEducationData([...educationData, newEducation]);
                    message.success('Education added successfully');
                    setIsEditModalVisible(false);
                    educationForm.resetFields();
                })
                .catch(info => {
                    console.log('Validate Failed:', info);
                });
        } else if (activeForm === 'experience') {
            experienceForm.validateFields()
                .then(values => {
                    console.log('Experience info:', values);
                    const newExperience = {
                        id: experienceData.length + 1,
                        position: values.position,
                        company: values.company,
                        duration: `${values.startDate.format('YYYY')} - ${values.current ? 'Present' : values.endDate.format('YYYY')}`,
                        description: values.description
                    };
                    setExperienceData([...experienceData, newExperience]);
                    message.success('Experience added successfully');
                    setIsEditModalVisible(false);
                    experienceForm.resetFields();
                })
                .catch(info => {
                    console.log('Validate Failed:', info);
                });
        } else if (activeForm === 'certification') {
            certificationForm.validateFields()
                .then(values => {
                    console.log('Certification info:', values);
                    const newCertification = {
                        id: certificationsData.length + 1,
                        name: values.name,
                        year: values.year.format('YYYY')
                    };
                    setCertificationsData([...certificationsData, newCertification]);
                    message.success('Certification added successfully');
                    setIsEditModalVisible(false);
                    certificationForm.resetFields();
                })
                .catch(info => {
                    console.log('Validate Failed:', info);
                });
        } else if (activeForm === 'project') {
            projectForm.validateFields()
                .then(values => {
                    console.log('Project info:', values);
                    const newProject = {
                        id: projectsData.length + 1,
                        name: values.name,
                        description: values.description,
                        technologies: values.technologies || []
                    };
                    setProjectsData([...projectsData, newProject]);
                    message.success('Project added successfully');
                    setIsEditModalVisible(false);
                    projectForm.resetFields();
                })
                .catch(info => {
                    console.log('Validate Failed:', info);
                });
        } else if (activeForm === 'language') {
            // Language form would be handled similarly
            setIsEditModalVisible(false);
        }
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
    };

    const handleAvatarChange = (info) => {
        if (info.file.status === 'done') {
            message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} file upload failed.`);
        }
    };

    const avatarUploadProps = {
        name: 'avatar',
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        headers: {
            authorization: 'authorization-text',
        },
        onChange: handleAvatarChange,
    };

    const deleteItem = (type, id) => {
        if (type === 'skill') {
            setExpertiseData(expertiseData.filter(item => item.id !== id));
            message.success('Skill deleted successfully');
        } else if (type === 'education') {
            setEducationData(educationData.filter(item => item.id !== id));
            message.success('Education deleted successfully');
        } else if (type === 'experience') {
            setExperienceData(experienceData.filter(item => item.id !== id));
            message.success('Experience deleted successfully');
        } else if (type === 'certification') {
            setCertificationsData(certificationsData.filter(item => item.id !== id));
            message.success('Certification deleted successfully');
        } else if (type === 'project') {
            setProjectsData(projectsData.filter(item => item.id !== id));
            message.success('Project deleted successfully');
        } else if (type === 'language') {
            setLanguagesData(languagesData.filter(item => item.id !== id));
            message.success('Language deleted successfully');
        }
    };

    const renderForm = () => {
        switch(activeForm) {
            case 'personal':
                return (
                    <Form
                        form={personalForm}
                        layout="vertical"
                        name="personalForm"
                    >
                        <Row gutter={16}>
                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="fname"
                                    label="First Name"
                                    rules={[{ required: true, message: 'Please input your first name!' }]}
                                >
                                    <Input placeholder="First Name" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="mname"
                                    label="Middle Name"
                                >
                                    <Input placeholder="Middle Name" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Form.Item
                                    name="lname"
                                    label="Last Name"
                                    rules={[{ required: true, message: 'Please input your last name!' }]}
                                >
                                    <Input placeholder="Last Name" />
                                </Form.Item>
                            </Col>
                        </Row>
                        
                        <Form.Item
                            name="title"
                            label="Professional Title"
                        >
                            <Input placeholder="e.g. Senior Software Engineer" />
                        </Form.Item>
                        
                        <Form.Item
                            name="summary"
                            label="Professional Summary"
                        >
                            <TextArea rows={4} placeholder="Brief description about yourself and your career" />
                        </Form.Item>
                        
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[{ type: 'email', message: 'Please enter a valid email!' }]}
                                >
                                    <Input prefix={<MailOutlined />} placeholder="Email" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="phone"
                                    label="Phone"
                                >
                                    <Input prefix={<PhoneOutlined />} placeholder="Phone" />
                                </Form.Item>
                            </Col>
                        </Row>
                        
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="website"
                                    label="Website"
                                >
                                    <Input prefix={<GlobalOutlined />} placeholder="Website URL" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="location"
                                    label="Location"
                                >
                                    <Input prefix={<EnvironmentOutlined />} placeholder="City, Country" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                );
            case 'skill':
                return (
                    <Form
                        form={skillsForm}
                        layout="vertical"
                        name="skillsForm"
                    >
                        <Form.Item
                            name="skill"
                            label="Skill Name"
                            rules={[{ required: true, message: 'Please input skill name!' }]}
                        >
                            <Input placeholder="e.g. ReactJS, JavaScript, UI/UX Design" />
                        </Form.Item>
                        
                        <Form.Item
                            name="proficiency"
                            label="Proficiency (0-100%)"
                            rules={[{ required: true, message: 'Please input proficiency level!' }]}
                        >
                            <InputNumber 
                                min={0} 
                                max={100} 
                                style={{ width: '100%' }} 
                                placeholder="Enter a number between 0 and 100" 
                            />
                        </Form.Item>
                    </Form>
                );
            case 'education':
                return (
                    <Form
                        form={educationForm}
                        layout="vertical"
                        name="educationForm"
                    >
                        <Form.Item
                            name="degree"
                            label="Degree/Certificate"
                            rules={[{ required: true, message: 'Please input degree name!' }]}
                        >
                            <Input placeholder="e.g. Bachelor of Science in Computer Science" />
                        </Form.Item>
                        
                        <Form.Item
                            name="institution"
                            label="Institution"
                            rules={[{ required: true, message: 'Please input institution name!' }]}
                        >
                            <Input placeholder="e.g. University of Technology" />
                        </Form.Item>
                        
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="startYear"
                                    label="Start Year"
                                    rules={[{ required: true, message: 'Please select start year!' }]}
                                >
                                    <DatePicker picker="year" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="endYear"
                                    label="End Year (or expected)"
                                    rules={[{ required: true, message: 'Please select end year!' }]}
                                >
                                    <DatePicker picker="year" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        
                        <Form.Item
                            name="description"
                            label="Description"
                        >
                            <TextArea rows={3} placeholder="Description of your studies, achievements, etc." />
                        </Form.Item>
                    </Form>
                );
            case 'experience':
                return (
                    <Form
                        form={experienceForm}
                        layout="vertical"
                        name="experienceForm"
                    >
                        <Form.Item
                            name="position"
                            label="Position"
                            rules={[{ required: true, message: 'Please input position title!' }]}
                        >
                            <Input placeholder="e.g. Senior Software Engineer" />
                        </Form.Item>
                        
                        <Form.Item
                            name="company"
                            label="Company"
                            rules={[{ required: true, message: 'Please input company name!' }]}
                        >
                            <Input placeholder="e.g. Tech Solutions Inc." />
                        </Form.Item>
                        
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="startDate"
                                    label="Start Date"
                                    rules={[{ required: true, message: 'Please select start date!' }]}
                                >
                                    <DatePicker picker="month" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="endDate"
                                    label="End Date"
                                >
                                    <DatePicker picker="month" style={{ width: '100%' }} disabled={experienceForm.getFieldValue('current')} />
                                </Form.Item>
                            </Col>
                        </Row>
                        
                        <Form.Item
                            name="current"
                            valuePropName="checked"
                        >
                            <Input type="checkbox" /> I currently work here
                        </Form.Item>
                        
                        <Form.Item
                            name="description"
                            label="Description"
                        >
                            <TextArea rows={3} placeholder="Describe your responsibilities and achievements" />
                        </Form.Item>
                    </Form>
                );
            case 'certification':
                return (
                    <Form
                        form={certificationForm}
                        layout="vertical"
                        name="certificationForm"
                    >
                        <Form.Item
                            name="name"
                            label="Certification Name"
                            rules={[{ required: true, message: 'Please input certification name!' }]}
                        >
                            <Input placeholder="e.g. AWS Certified Solutions Architect" />
                        </Form.Item>
                        
                        <Form.Item
                            name="organization"
                            label="Issuing Organization"
                        rules={[{ required: true, message: 'Please input organization name!' }]}
                        >
                            <Input placeholder="e.g. Amazon Web Services" />
                        </Form.Item>
                        
                        <Form.Item
                            name="year"
                            label="Issue Year"
                            rules={[{ required: true, message: 'Please select issue year!' }]}
                        >
                            <DatePicker picker="year" style={{ width: '100%' }} />
                        </Form.Item>
                        
                        <Form.Item
                            name="credential"
                            label="Credential ID (Optional)"
                        >
                            <Input placeholder="e.g. AWS-12345" />
                        </Form.Item>
                        
                        <Form.Item
                            name="url"
                            label="Credential URL (Optional)"
                        >
                            <Input placeholder="https://..." />
                        </Form.Item>
                    </Form>
                );
            case 'project':
                return (
                    <Form
                        form={projectForm}
                        layout="vertical"
                        name="projectForm"
                    >
                        <Form.Item
                            name="name"
                            label="Project Name"
                            rules={[{ required: true, message: 'Please input project name!' }]}
                        >
                            <Input placeholder="e.g. E-commerce Platform" />
                        </Form.Item>
                        
                        <Form.Item
                            name="description"
                            label="Description"
                            rules={[{ required: true, message: 'Please input project description!' }]}
                        >
                            <TextArea rows={3} placeholder="Describe the project, your role, and key achievements" />
                        </Form.Item>
                        
                        <Form.Item
                            name="technologies"
                            label="Technologies Used"
                        >
                            <Select
                                mode="tags"
                                placeholder="Add technologies (press Enter to add)"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                        
                        <Form.Item
                            name="url"
                            label="Project URL (Optional)"
                        >
                            <Input placeholder="https://..." />
                        </Form.Item>
                    </Form>
                );
            default:
                return <div>Select a form</div>;
        }
    };

    const getModalTitle = () => {
        switch(activeForm) {
            case 'personal': return 'Edit Personal Information';
            case 'skill': return 'Add New Skill';
            case 'education': return 'Add Education';
            case 'experience': return 'Add Work Experience';
            case 'certification': return 'Add Certification';
            case 'project': return 'Add Project';
            case 'language': return 'Add Language';
            default: return 'Edit Information';
        }
    };

    return (
        <Layout>
            <HeaderTitle title="Profile Page" />
            <div style={{ marginTop: 20 }}></div>
            <Spin spinning={isFetching}>
                <Row gutter={[16, 16]}>
                    {/* Left Column - Profile Card & Expertise */}
                    <Col xs={24} lg={8}>
                        <Card style={{ marginBottom: 16 }}>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <Avatar 
                                    size={100} 
                                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGQHpgtS41XuGtJXYysNDCWielI5vbs11ajHg4OiE&s" 
                                />
                                <Upload {...avatarUploadProps} showUploadList={false}>
                                    <Button icon={<UploadOutlined />} style={{ marginTop: 10 }} size="small">
                                        Change Avatar
                                    </Button>
                                </Upload>
                                <Title level={3} style={{ marginTop: 10, marginBottom: 0 }}>
                                    {profile?.fname} {profile?.mname}. {profile?.lname}
                                </Title>
                                <Text type="secondary">Senior Software Engineer</Text>
                                
                                <div style={{ marginTop: 15 }}>
                                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal('personal')}>
                                        Edit Profile
                                    </Button>
                                </div>
                            </div>
                            
                            <Divider />
                            
                            <div style={{ marginBottom: 15 }}>
                                <Title level={5}><MailOutlined /> Contact Information</Title>
                                <div style={{ marginLeft: 24 }}>
                                    <Paragraph style={{ marginBottom: 5 }}>
                                        <MailOutlined style={{ marginRight: 8 }} />
                                        {profile?.email || 'email@example.com'}
                                    </Paragraph>
                                    <Paragraph style={{ marginBottom: 5 }}>
                                        <PhoneOutlined style={{ marginRight: 8 }} />
                                        +1 (555) 123-4567
                                    </Paragraph>
                                    <Paragraph style={{ marginBottom: 5 }}>
                                        <GlobalOutlined style={{ marginRight: 8 }} />
                                        <a href="https://personal-website.com">https://personal-website.com</a>
                                    </Paragraph>
                                    <Paragraph style={{ marginBottom: 5 }}>
                                        <EnvironmentOutlined style={{ marginRight: 8 }} />
                                        San Francisco, CA
                                    </Paragraph>
                                </div>
                            </div>
                        </Card>
                        
                        <Card 
                            title="Expertise & Skills" 
                            style={{ marginBottom: 16 }}
                            extra={
                                <Button 
                                    type="text" 
                                    icon={<PlusOutlined />} 
                                    size="small"
                                    onClick={() => showEditModal('skill')}
                                />
                            }
                        >
                            {expertiseData.map((item) => (
                                <div key={item.id} style={{ marginBottom: 15, position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong>{item.skill}</Text>
                                        <Text>{item.proficiency}%</Text>
                                    </div>
                                    <Progress 
                                        percent={item.proficiency} 
                                        size="small" 
                                        status="active" 
                                        showInfo={false}
                                    />
                                    <Button 
                                        type="text" 
                                        icon={<DeleteOutlined />} 
                                        size="small" 
                                        style={{ position: 'absolute', right: -10, top: -5 }}
                                        onClick={() => deleteItem('skill', item.id)}
                                    />
                                </div>
                            ))}
                            <Button 
                                type="dashed" 
                                block 
                                icon={<PlusOutlined />}
                                onClick={() => showEditModal('skill')}
                            >
                                Add Skill
                            </Button>
                        </Card>
                        
                        <Card 
                            title="Languages"
                            extra={
                                <Button 
                                    type="text" 
                                    icon={<PlusOutlined />} 
                                    size="small"
                                    onClick={() => showEditModal('language')}
                                />
                            }
                        >
                            {languagesData.map((item) => (
                                <div key={item.id} style={{ marginBottom: 15, position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong>{item.language}</Text>
                                        <Text>{item.level}</Text>
                                    </div>
                                    <Progress 
                                        percent={item.proficiency} 
                                        size="small" 
                                        status="active" 
                                        showInfo={false}
                                    />
                                    <Button 
                                        type="text" 
                                        icon={<DeleteOutlined />} 
                                        size="small" 
                                        style={{ position: 'absolute', right: -10, top: -5 }}
                                        onClick={() => deleteItem('language', item.id)}
                                    />
                                </div>
                            ))}
                            <Button 
                                type="dashed" 
                                block 
                                icon={<PlusOutlined />} 
                                style={{ marginTop: 15 }}
                                onClick={() => showEditModal('language')}
                            >
                                Add Language
                            </Button>
                        </Card>
                    </Col>
                    
                    {/* Right Column - Detailed Information */}
                    <Col xs={24} lg={16}>
                        <Card>
                            <Tabs defaultActiveKey="about">
                                <TabPane tab="About" key="about">
                                    <Title level={4}>Professional Summary</Title>
                                    <Paragraph>
                                        Experienced software engineer with over 8 years of expertise in developing 
                                        scalable web applications using modern JavaScript frameworks. Passionate 
                                        about clean code architecture, user experience, and mentoring junior developers. 
                                        Strong background in both frontend and backend development with a focus on 
                                        React.js and Node.js ecosystems.
                                    </Paragraph>
                                    
                                    <Title level={4}>Education</Title>
                                    {educationData.map((item) => (
                                        <div key={item.id} style={{ marginBottom: 20, position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text strong>{item.degree}</Text>
                                                <Text type="secondary">{item.year}</Text>
                                            </div>
                                            <Text type="secondary">{item.institution}</Text>
                                            <Paragraph>{item.description}</Paragraph>
                                            <Space>
                                                <Button type="text" icon={<EditOutlined />} size="small">Edit</Button>
                                                <Button 
                                                    type="text" 
                                                    icon={<DeleteOutlined />} 
                                                    size="small"
                                                    onClick={() => deleteItem('education', item.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </Space>
                                        </div>
                                    ))}
                                    <Button 
                                        type="dashed" 
                                        icon={<PlusOutlined />}
                                        onClick={() => showEditModal('education')}
                                    >
                                        Add Education
                                    </Button>
                                </TabPane>
                                
                                <TabPane tab="Experience" key="experience">
                                    {experienceData.map((item) => (
                                        <div key={item.id} style={{ marginBottom: 20, position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text strong>{item.position}</Text>
                                                <Text type="secondary">{item.duration}</Text>
                                            </div>
                                            <Text type="secondary">{item.company}</Text>
                                            <Paragraph>{item.description}</Paragraph>
                                            <Space>
                                                <Button type="text" icon={<EditOutlined />} size="small">Edit</Button>
                                                <Button 
                                                    type="text" 
                                                    icon={<DeleteOutlined />} 
                                                    size="small"
                                                    onClick={() => deleteItem('experience', item.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </Space>
                                        </div>
                                    ))}
                                    <Button 
                                        type="dashed" 
                                        icon={<PlusOutlined />}
                                        onClick={() => showEditModal('experience')}
                                    >
                                        Add Experience
                                    </Button>
                                </TabPane>
                                
                                <TabPane tab="Certifications" key="certifications">
                                    <List
                                        dataSource={certificationsData}
                                        renderItem={item => (
                                            <List.Item
                                                actions={[
                                                    <Button type="text" icon={<EditOutlined />} size="small">Edit</Button>,
                                                    <Button 
                                                        type="text" 
                                                        icon={<DeleteOutlined />} 
                                                        size="small"
                                                        onClick={() => deleteItem('certification', item.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    avatar={<SafetyCertificateOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                                                    title={item.name}
                                                    description={`Issued in ${item.year}`}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                    <Button 
                                        type="dashed" 
                                        icon={<PlusOutlined />} 
                                        style={{ marginTop: 16 }}
                                        onClick={() => showEditModal('certification')}
                                    >
                                        Add Certification
                                    </Button>
                                </TabPane>
                                
                                <TabPane tab="Projects" key="projects">
                                    {projectsData.map((item) => (
                                        <div key={item.id} style={{ marginBottom: 20, position: 'relative' }}>
                                            <Title level={5}>{item.name}</Title>
                                            <Paragraph>
                                                {item.description}
                                            </Paragraph>
                                            <div>
                                                {item.technologies.map((tech, index) => (
                                                    <Tag color="blue" key={index}>{tech}</Tag>
                                                ))}
                                            </div>
                                            <Space style={{ marginTop: 10 }}>
                                                <Button type="text" icon={<EditOutlined />} size="small">Edit</Button>
                                                <Button 
                                                    type="text" 
                                                    icon={<DeleteOutlined />} 
                                                    size="small"
                                                    onClick={() => deleteItem('project', item.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </Space>
                                        </div>
                                    ))}
                                    <Button 
                                        type="dashed" 
                                        icon={<PlusOutlined />}
                                        onClick={() => showEditModal('project')}
                                    >
                                        Add Project
                                    </Button>
                                </TabPane>
                            </Tabs>
                        </Card>
                    </Col>
                </Row>

                {/* Edit Profile Modal */}
                <Modal
                    title={getModalTitle()}
                    visible={isEditModalVisible}
                    onOk={handleEditOk}
                    onCancel={handleEditCancel}
                    width={700}
                    footer={[
                        <Button key="back" onClick={handleEditCancel}>
                            Cancel
                        </Button>,
                        <Button key="submit" type="primary" onClick={handleEditOk}>
                            {activeForm === 'personal' ? 'Save Changes' : 'Add'}
                        </Button>,
                    ]}
                >
                    {renderForm()}
                </Modal>
            </Spin>
        </Layout>
    );
};

export default React.memo(ProfilePage);