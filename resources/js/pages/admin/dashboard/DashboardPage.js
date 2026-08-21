"use client"

import { useEffect, useState } from "react"
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  List,
  Avatar,
  Typography,
  Space,
  Select,
  DatePicker,
  Table,
  Tooltip,
  Rate,
  Button,
  Modal,
} from "antd"
import { UserOutlined, TeamOutlined, TrophyOutlined, PrinterOutlined,CheckCircleOutlined } from "@ant-design/icons"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  LabelList,
} from "recharts"
import moment from "moment"
import logo from "~/assets/images/OCC_LOGO.png"
import { Layout, CardSkeletonGrid, HeroSkeleton } from "~/components"
import "./AlumniDashboard.css"
import useAdminDashboard from "~/hooks/useAdminDashboard"
import axios from "~/utils/axiosConfig"

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const AlumniDashboard = () => {
  const [printPreviewVisible, setPrintPreviewVisible] = useState(false)
  const [timeRange, setTimeRange] = useState("current")
  const [selectedMajor, setSelectedMajor] = useState("all")
  const currentYear = new Date().getFullYear()
  const [year, setSelectedYear] = useState("all")
  const [employmentData, setEmploymentData] = useState(null)
  const [alumniMetrics, setAlumniMetrics] = useState(null)
  const [industryDistribution, setIndustryDistribution] = useState([])
  const [salaryProgression, setSalaryProgression] = useState([])
  const [topEmployers, setTopEmployers] = useState([])
  const [employmentByCourse, setEmploymentByCourse] = useState([])

  const { isLoading, data: alumni = [], isFetching, refetch } = useAdminDashboard(year)


  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch()
    }, 30000) // 30 seconds

    return () => clearInterval(intervalId)
  }, [refetch])

  useEffect(() => {
    const processAlumniData = () => {
      if (!Array.isArray(alumni?.alumni)) {
        setEmploymentData(null)
        setAlumniMetrics(null)
        setIndustryDistribution([])
        setSalaryProgression([])
        setTopEmployers([])
        setEmploymentByCourse([])
        return
      }

      try {
        const alumniList = alumni.alumni
        const totalAlumni = alumniList.length
        const course = alumni.course || []

        // Initialize counters for employment data
        let employedCount = 0
        let unemployedCount = 0
        let underEmployedCount = 0
        let activeThisYear = 0
        let totalSalary = 0
        let salaryCount = 0
        const satisfactionTotal = 0
        const satisfactionCount = 0
        const eventParticipationCount = 0
        const mentorshipCount = 0

        const byMajorData = {}
        const graduationYearData = {}
        const industryData = {}
        const employerData = {}
        const salaryByExperience = {}
        const courseEmploymentData = {}

        const currentYear = new Date().getFullYear()

        alumniList.forEach((alum) => {
          // console.log(alum)
          const employmentStatus = alum.employment_status_id
          const femploymentStatus = alum.femployment_status_id
          const major = alum.course_id
          const courseData = course.find((item) => item.id === alum.course_id)
          // console.log(courseData)
          const courseName = courseData.course_code || `Course ${alum.course_id}`

          const graduationYear = alum.graduation_year
          const industry = alum.industry
          const employer = alum.current_company
          const salary = alum.salary_range
          const yearsExperience = alum.years_experience

          
          if (employmentStatus === 1 || femploymentStatus === 1) {
            employedCount++
          } else if (employmentStatus === 2 || femploymentStatus === 2) {
            unemployedCount++
          } else if (employmentStatus === 3 || femploymentStatus === 3) {
            underEmployedCount++
          }

          // Count active this year (graduated in last 5 years)
          if (graduationYear && graduationYear >= currentYear - 5) {
            activeThisYear++
          }

          // Process salary data
          if (salary) {
            // Extract numbers including commas → "20,000" stays intact
            const salaryMatch = salary.match(/[\d,]+/g)

            if (salaryMatch && salaryMatch.length > 0) {
              // Convert "20,000" → 20000
              const numericValues = salaryMatch.map((num) => Number.parseInt(num.replace(/,/g, "")))

              const avgSalary = numericValues.reduce((sum, num) => sum + num, 0) / numericValues.length

              totalSalary += avgSalary
              salaryCount++
            }
          }

          // // Process salary data
          // if (salary) {
          //     const salaryMatch = salary.match(/\d+/g);
          //     if (salaryMatch && salaryMatch.length > 0) {
          //         const avgSalary =
          //             salaryMatch.reduce(
          //                 (sum, num) => sum + parseInt(num),
          //                 0
          //             ) / salaryMatch.length;
          //         totalSalary += avgSalary;
          //         salaryCount++;
          //     }
          // }

          // Process by course data for the new chart
          if (courseName) {
            if (!courseEmploymentData[courseName]) {
              courseEmploymentData[courseName] = {
                total: 0,
                employed: 0,
                unemployed: 0,
                underEmployed: 0,
                employmentRate: 0,
              }
            }

            courseEmploymentData[courseName].total++

            if (employmentStatus === 1 || femploymentStatus === 1) {
              courseEmploymentData[courseName].employed++
            } else if (employmentStatus === 2 || femploymentStatus === 2) {
              courseEmploymentData[courseName].unemployed++
            } else if (employmentStatus === 3 || femploymentStatus === 3) {
              courseEmploymentData[courseName].underEmployed++
            }
          }

          // Process by major data
          if (major) {
            if (!byMajorData[major]) {
              byMajorData[major] = {
                employed: 0,
                unemployed: 0,
                underEmployed: 0,
                total: 0,
                name: `Major ${major}`,
              }
            }
            byMajorData[major].total++
            if (employmentStatus === 1 || femploymentStatus === 1) {
              byMajorData[major].employed++
            } else if (employmentStatus === 2 || femploymentStatus === 2) {
              byMajorData[major].unemployed++
            } else if (employmentStatus === 3 || femploymentStatus === 3) {
              byMajorData[major].underEmployed++
            }
          }

          // Process graduation year data for trends
          if (graduationYear) {
            if (!graduationYearData[graduationYear]) {
              graduationYearData[graduationYear] = {
                employed: 0,
                unemployed: 0,
                underEmployed: 0,
                total: 0,
              }
            }
            graduationYearData[graduationYear].total++
            if (employmentStatus === 1 || femploymentStatus === 1) {
              graduationYearData[graduationYear].employed++
            } else if (employmentStatus === 2 || femploymentStatus === 2) {
              graduationYearData[graduationYear].unemployed++
            } else if (employmentStatus === 3 || femploymentStatus === 3) {
              graduationYearData[graduationYear].underEmployed++
            }
          }

          // Process industry distribution
          if (industry) {
            industryData[industry] = (industryData[industry] || 0) + 1
          }

          // Process employer data
          if (employer) {
            employerData[employer] = (employerData[employer] || 0) + 1
          }

          // Process salary progression by experience
          if (yearsExperience && salary) {
            const expKey = Math.floor(yearsExperience)

            // Parse salary numbers from string
            const salaryMatch = salary.match(/\d+/g)
            if (salaryMatch && salaryMatch.length > 0) {
              // Calculate midpoint of range
              const avgSalary = salaryMatch.reduce((sum, num) => sum + Number.parseInt(num), 0) / salaryMatch.length
              const roundedSalary = Math.round(avgSalary)

              // Initialize experience year entry
              if (!salaryByExperience[expKey]) {
                salaryByExperience[expKey] = {}
              }

              // Track count for each salary
              if (!salaryByExperience[expKey][roundedSalary]) {
                salaryByExperience[expKey][roundedSalary] = 0
              }
              salaryByExperience[expKey][roundedSalary] += 1
            }
          }
        })

        // Calculate employment rates for each course
        Object.keys(courseEmploymentData).forEach((courseName) => {
          const course = courseEmploymentData[courseName]
          course.employmentRate = course.total > 0 ? Math.round((course.employed / course.total) * 100) : 0
        })

        // Format course employment data for the chart
        const courseEmploymentFormatted = Object.entries(courseEmploymentData)
          .map(([courseName, data]) => ({
            course: courseName,
            total: data.total,
            employed: data.employed,
            unemployed: data.unemployed,
            underEmployed: data.underEmployed,
            employmentRate: data.employmentRate,
            employedPercentage: data.total > 0 ? Math.round((data.employed / data.total) * 100) : 0,
            unemployedPercentage: data.total > 0 ? Math.round((data.unemployed / data.total) * 100) : 0,
            underEmployedPercentage: data.total > 0 ? Math.round((data.underEmployed / data.total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total)

        // Calculate employment data
        const currentData = [
          {
            name: "Employed",
            value: totalAlumni > 0 ? Math.round((employedCount / totalAlumni) * 100) : 0,
            color: "#32d1b3",
            count: employedCount,
          },
          {
            name: "Unemployed",
            value: totalAlumni > 0 ? Math.round((unemployedCount / totalAlumni) * 100) : 0,
            color: "#ff4d4f",
            count: unemployedCount,
          },
          {
            name: "Under Employed",
            value: totalAlumni > 0 ? Math.round((underEmployedCount / totalAlumni) * 100) : 0,
            color: "#faad14",
            count: underEmployedCount,
          },
        ]

        // Format trend data (last 6 years)
        const recentYears = Object.keys(graduationYearData)
          .map(Number)
          .filter((year) => year >= currentYear - 6)
          .sort((a, b) => a - b)

        const trendDataFormatted = recentYears.map((year) => ({
          month: year.toString(),
          employed:
            graduationYearData[year].total > 0
              ? Math.round((graduationYearData[year].employed / graduationYearData[year].total) * 100)
              : 0,
          unemployed:
            graduationYearData[year].total > 0
              ? Math.round((graduationYearData[year].unemployed / graduationYearData[year].total) * 100)
              : 0,
          underEmployed:
            graduationYearData[year].total > 0
              ? Math.round((graduationYearData[year].underEmployed / graduationYearData[year].total) * 100)
              : 0,
          // extra raw counts used in print report
          totalGrads: graduationYearData[year].total,
          employedCount: graduationYearData[year].employed,
          unemployedCount: graduationYearData[year].unemployed,
          underEmployedCount: graduationYearData[year].underEmployed,
        }))

        // Format by major data
        const byMajorFormatted = Object.values(byMajorData).map((data) => ({
          major: data.name,
          employed: data.total > 0 ? Math.round((data.employed / data.total) * 100) : 0,
          unemployed: data.total > 0 ? Math.round((data.unemployed / data.total) * 100) : 0,
          underEmployed: data.total > 0 ? Math.round((data.underEmployed / data.total) * 100) : 0,
          totalGraduates: data.total,
        }))

        // Format industry distribution
        const industryColors = ["#1890ff", "#52c41a", "#faad14", "#722ed1", "#fa541c", "#13c2c2"]
        const industryFormatted = Object.entries(industryData)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([name, value], index) => ({
            name,
            value: Math.round((value / totalAlumni) * 100),
            count: value,
            color: industryColors[index] || "#666666",
          }))

        // Format salary progression for chart
        const salaryProgressionFormatted = []

        Object.entries(salaryByExperience)
          .sort(([a], [b]) => a - b)
          .forEach(([years, salariesObj]) => {
            Object.entries(salariesObj).forEach(([salary, count]) => {
              salaryProgressionFormatted.push({
                year: `${years} Year${years > 1 ? "s" : ""}`,
                salary: Number.parseInt(salary),
                alumniCount: count, // Track how many alumni have this salary
              })
            })
          })

        // Format top employers
        const topEmployersFormatted = Object.entries(employerData)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([name, hires]) => ({
            name,
            hires,
            trend: "up",
          }))

        // Calculate metrics
        const averageSalary = salaryCount > 0 ? Math.round(totalSalary / salaryCount) : 0

        setEmploymentData({
          current: currentData,
          trend: trendDataFormatted,
          byMajor: byMajorFormatted,
          summary: {
            totalAlumni,
            employedCount,
            unemployedCount,
            underEmployedCount,
          },
        })

        setAlumniMetrics({
          totalAlumni,
          activeThisYear,
          averageSalary,
          satisfactionRate: 4.7, // You can calculate this from actual data if available
          eventParticipation: 68, // You can calculate this from actual data if available
          mentorshipEngagement: 42, // You can calculate this from actual data if available
        })

        setIndustryDistribution(industryFormatted)
        setSalaryProgression(salaryProgressionFormatted)
        setTopEmployers(topEmployersFormatted)
        setEmploymentByCourse(courseEmploymentFormatted)
      } catch (err) {
        console.error("Error processing alumni data:", err)
        // Set default/fallback data
        setEmploymentData({
          current: [
            { name: "Employed", value: 0, color: "#32d1b3", count: 0 },
            { name: "Unemployed", value: 0, color: "#ff4d4f", count: 0 },
            { name: "Under Employed", value: 0, color: "#faad14", count: 0 },
          ],
          trend: [],
          byMajor: [],
          summary: { totalAlumni: 0, employedCount: 0, unemployedCount: 0, underEmployedCount: 0 },
        })
        setAlumniMetrics({
          totalAlumni: 0,
          activeThisYear: 0,
          averageSalary: 0,
          satisfactionRate: 0,
          eventParticipation: 0,
          mentorshipEngagement: 0,
        })
        setIndustryDistribution([])
        setSalaryProgression([])
        setTopEmployers([])
        setEmploymentByCourse([])
      }
    }

    processAlumniData()
  }, [alumni])


  const handlePrint = () => {
    setPrintPreviewVisible(true)
  }

  const handleClosePreview = () => {
    setPrintPreviewVisible(false)
  }

  const handleActualPrint = () => {
    setTimeout(() => {
      window.print()
    }, 100)
  }


  // Chart Components
  const EmploymentPieChart = () => (
    <div className="chart-container">
      <Title level={4}>Overall Employment Status</Title>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={employmentData?.current || []}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {(employmentData?.current || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip formatter={(value, name) => [`${value}%`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {(employmentData?.current || []).map((item, index) => (
          <div key={index} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: item.color }} />
            <Text>{item.name}</Text>
            <Text strong>{item.value}%</Text>
            <Text type="secondary">({item.count} alumni)</Text>
          </div>
        ))}
      </div>
    </div>
  )

  const EmploymentTrendChart = () => (
    <div className="chart-container">
      <Title level={4}>Employment Trend (Last 6 Years)</Title>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={employmentData?.trend || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <RechartsTooltip formatter={(value) => [`${value}%`, "Percentage"]} />
          <Legend />
          <Area type="monotone" dataKey="employed" stackId="1" stroke="#32d1b3" fill="#32d1b3" fillOpacity={0.6} name="Employed" />
          <Area type="monotone" dataKey="underEmployed" stackId="1" stroke="#faad14" fill="#faad14" fillOpacity={0.6} name="Under Employed" />
          <Area type="monotone" dataKey="unemployed" stackId="1" stroke="#ff4d4f" fill="#ff4d4f" fillOpacity={0.6} name="Unemployed" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )

  const IndustryDistributionChart = () => (
    <div className="chart-container">
      <Title level={4}>Industry Distribution</Title>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={industryDistribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <RechartsTooltip formatter={(value) => [`${value}%`, "Percentage"]} />
          <Bar dataKey="value" name="Percentage">
            {industryDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="value" position="top" formatter={(value) => `${value}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
  const SalaryProgressionChart = () => (
    <div className="chart-container">
      <Title level={4}>Average Salary Progression</Title>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={salaryProgression}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <RechartsTooltip
            formatter={(value, name, props) => {
              const { payload } = props
              const count = payload.alumniCount || 1
              return [`₱${value?.toLocaleString() || 0}${count > 1 ? ` (${count} Alumni)` : ""}`, "Salary"]
            }}
          />
          <Line type="monotone" dataKey="salary" stroke="#1890ff" strokeWidth={3} dot={{ fill: "#1890ff" }} name="Salary" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  const EmploymentByMajorTable = () => (
    <div className="chart-container">
      <Title level={4}>Employment by Major</Title>
      <Table
        dataSource={employmentData?.byMajor || []}
        pagination={false}
        size="small"
        loading={!employmentData}
        columns={[
          { title: "Major", dataIndex: "major", key: "major" },
          { title: "Employed", dataIndex: "employed", key: "employed", render: (value) => <Text strong>{value}%</Text> },
          { title: "Unemployed", dataIndex: "unemployed", key: "unemployed", render: (value) => <Text type="secondary">{value}%</Text> },
          { title: "Under Employed", dataIndex: "underEmployed", key: "underEmployed", render: (value) => <Text type="secondary">{value}%</Text> },
          { title: "Total Graduates", dataIndex: "totalGraduates", key: "totalGraduates", render: (value) => <Text>{value}</Text> },
        ]}
      />
    </div>
  )

  const EmploymentByCourseChart = () => (
    <div className="chart-container" style={{ marginBottom: 20 }}>
      <Title level={4}>Employment Statistics by Course</Title>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={employmentByCourse} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="course" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <RechartsTooltip
            formatter={(value, name) => {
              if (name === "Employment Rate") return [`${value}%`, name]
              return [value, name]
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="employed" name="Employed" fill="#32d1b3" barSize={20} />
          <Bar yAxisId="left" dataKey="unemployed" name="Unemployed" fill="#ff4d4f" barSize={20} />
          <Bar yAxisId="left" dataKey="underEmployed" name="Under Employed" fill="#faad14" barSize={20} />
          <Line yAxisId="right" type="monotone" dataKey="employmentRate" name="Employment Rate" stroke="#1890ff" strokeWidth={3} dot={{ fill: "#1890ff", strokeWidth: 2, r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>

      <Table
        dataSource={employmentByCourse}
        pagination={false}
        size="small"
        style={{ marginTop: 20 }}
        scroll={{ x: 600 }}
        rowKey="course"
        columns={[
          {
            title: "Course", dataIndex: "course", key: "course", fixed: "left", width: 150,
            render: (text) => (
              <Tooltip title={text}>
                <Text strong>{text.length > 20 ? `${text.substring(0, 20)}...` : text}</Text>
              </Tooltip>
            ),
          },
          { title: "Total Alumni", dataIndex: "total", key: "total", render: (value) => <Text>{value}</Text> },
          {
            title: "Employed", key: "employed",
            render: (_, record) => (
              <Space><Text strong>{record.employed}</Text><Text type="secondary">({record.employedPercentage}%)</Text></Space>
            ),
          },
          {
            title: "Unemployed", key: "unemployed",
            render: (_, record) => (
              <Space><Text type="danger">{record.unemployed}</Text><Text type="secondary">({record.unemployedPercentage}%)</Text></Space>
            ),
          },
          {
            title: "Under Employed", key: "underEmployed",
            render: (_, record) => (
              <Space><Text type="warning">{record.underEmployed}</Text><Text type="secondary">({record.underEmployedPercentage}%)</Text></Space>
            ),
          },
          {
            title: "Employment Rate", dataIndex: "employmentRate", key: "employmentRate",
            render: (value) => (
              <Progress percent={value} size="small" status={value >= 80 ? "success" : value >= 60 ? "normal" : "exception"} />
            ),
          },
        ]}
      />
    </div>
  )
  const EmploymentByCourseStackedChart = () => (
    <div className="chart-container">
      <Title level={4}>Employment Distribution by Course (%)</Title>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={employmentByCourse} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="course" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
          <YAxis />
          <RechartsTooltip formatter={(value, name) => [`${value}%`, name]} />
          <Legend />
          <Bar dataKey="employedPercentage" name="Employed %" stackId="a" fill="#32d1b3" />
          <Bar dataKey="underEmployedPercentage" name="Under Employed %" stackId="a" fill="#faad14" />
          <Bar dataKey="unemployedPercentage" name="Unemployed %" stackId="a" fill="#ff4d4f" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  const TopEmployersList = () => (
    <div className="chart-container">
      <Title level={4}>Top Employers</Title>
      <List
        dataSource={topEmployers}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{
                    backgroundColor: ["#1890ff", "#52c41a", "#faad14", "#722ed1", "#fa541c", "#13c2c2"][index % 6],
                  }}
                >
                  {item.name.charAt(0)}
                </Avatar>
              }
              title={item.name}
              description={`${item.hires} hires`}
            />
            <div>
              <Tag color={item.trend === "up" ? "green" : item.trend === "down" ? "red" : "orange"}>{item.trend}</Tag>
            </div>
          </List.Item>
        )}
      />
    </div>
  )

  const getStatusTag = (status) => {
    const statusConfig = {
      employed: { color: "green", text: "Employed" },
      unemployed: { color: "red", text: "Seeking" },
      under_employed: { color: "orange", text: "Under Employed" },
      graduate_school: { color: "blue", text: "Graduate School" },
    }
    const config = statusConfig[status] || { color: "default", text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // ===== Derived insights used only inside the print report =====
  const totalAlumniSafe = alumniMetrics?.totalAlumni || 0
  const employedSafe = employmentData?.summary?.employedCount || 0
  const unemployedSafe = employmentData?.summary?.unemployedCount || 0
  const underEmployedSafe = employmentData?.summary?.underEmployedCount || 0
  const overallEmploymentRate = totalAlumniSafe > 0 ? Math.round((employedSafe / totalAlumniSafe) * 100) : 0
  const overallUnemploymentRate = totalAlumniSafe > 0 ? Math.round((unemployedSafe / totalAlumniSafe) * 100) : 0
  const overallUnderEmploymentRate = totalAlumniSafe > 0 ? Math.round((underEmployedSafe / totalAlumniSafe) * 100) : 0

  const bestCourse = employmentByCourse.length
    ? [...employmentByCourse].sort((a, b) => b.employmentRate - a.employmentRate)[0]
    : null
  const lowestCourse = employmentByCourse.length
    ? [...employmentByCourse].sort((a, b) => a.employmentRate - b.employmentRate)[0]
    : null
  const largestCohort = employmentByCourse.length
    ? [...employmentByCourse].sort((a, b) => b.total - a.total)[0]
    : null
  const topIndustry = industryDistribution.length ? industryDistribution[0] : null
  const topEmployer = topEmployers.length ? topEmployers[0] : null

  const salaryValues = (salaryProgression || []).map((s) => s.salary).filter((v) => Number.isFinite(v))
  const minSalary = salaryValues.length ? Math.min(...salaryValues) : 0
  const maxSalary = salaryValues.length ? Math.max(...salaryValues) : 0
  const medianSalary = (() => {
    if (!salaryValues.length) return 0
    const sorted = [...salaryValues].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  })()

  const trendArr = employmentData?.trend || []
  const latestTrend = trendArr.length ? trendArr[trendArr.length - 1] : null
  const earliestTrend = trendArr.length ? trendArr[0] : null
  const yoYChange = latestTrend && earliestTrend ? latestTrend.employed - earliestTrend.employed : 0

  if (isLoading) {
    return (
      <Layout>
        <div className="alumni-dashboard-container">
          <HeroSkeleton />
          <CardSkeletonGrid variant="stat" count={4} />
          <div style={{ marginTop: 20 }}>
            <CardSkeletonGrid variant="chart" count={1} columns={{ xs: 24 }} height={260} />
          </div>
          <div style={{ marginTop: 20 }}>
            <CardSkeletonGrid variant="chart" count={2} height={300} />
          </div>
          <div style={{ marginTop: 20 }}>
            <CardSkeletonGrid variant="chart" count={2} height={300} />
          </div>
          <div style={{ marginTop: 20 }}>
            <CardSkeletonGrid variant="list" count={2} rows={6} />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="alumni-dashboard-container">
       {/* =========================================================
            HEADER SECTION — Modern hero (matches AboutPage design)
           ========================================================= */}
        <section className="dashboard-hero">
          <div className="dashboard-hero__bg" aria-hidden="true">
            <span className="orb orb-1" />
            <span className="orb orb-2" />
            <span className="orb orb-3" />
            <div className="grid-overlay" />
          </div>

          <div className="dashboard-hero__content">
            <div className="dashboard-hero__left">
              <div className="dashboard-hero__brand">
                <img src={logo} alt="OCC Logo" className="dashboard-hero__logo" />
                <div className="dashboard-hero__brand-meta">
                  <Tag className="dashboard-chip" icon={<CheckCircleOutlined />}>
                    Live Analytics Dashboard
                  </Tag>
                  <Text className="dashboard-hero__eyebrow">Administrator Overview</Text>
                </div>
              </div>

              <Title level={2} className="dashboard-hero__title">
                Alumni <span className="grad-text">Dashboard</span>
              </Title>

              <Paragraph className="dashboard-hero__lead">
                Comprehensive overview of alumni employment, career progression,
                and engagement metrics — updated in real time based on Alumni Career Information.
              </Paragraph>
            </div>

            <div className="dashboard-hero__controls">
              <Select
                value={year}
                onChange={setSelectedYear}
                className="dashboard-hero__select"
                placeholder="Select Year"
              >
                <Option value="all">All Years</Option>
                {Array.from({ length: 25 }, (_, i) => {
                  const yearValue = currentYear - i
                  return (
                    <Option key={yearValue} value={yearValue.toString()}>
                      {yearValue}
                    </Option>
                  )
                })}
              </Select>

              <Button
                type="primary"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                className="dashboard-hero__print-btn"
              >
                Print Preview
              </Button>
            </div>
          </div>
        </section>

        {/* Metrics Row */}
        <Row gutter={[24, 24]} className="metrics-row">
          <Col xs={24} sm={12} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="Total Alumni"
                value={alumniMetrics?.totalAlumni || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
              <Progress percent={100} showInfo={false} status="active" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="Active This Year"
                value={alumniMetrics?.activeThisYear || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
              <Progress
                percent={
                  alumniMetrics?.totalAlumni
                    ? Math.round((alumniMetrics.activeThisYear / alumniMetrics.totalAlumni) * 100)
                    : 0
                }
                showInfo={false}
                status="active"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="Average Salary"
                value={alumniMetrics?.averageSalary || 0}
                valueStyle={{ color: "#faad14" }}
                formatter={(value) => `₱${value?.toLocaleString() || 0}`}
              />
              <Text type="secondary">Based on reported salaries</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="Overall Employment Rate"
                value={
                  employmentData?.summary
                    ? Math.round((employmentData.summary.employedCount / employmentData.summary.totalAlumni) * 100)
                    : 0
                }
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
              <Rate disabled value={alumniMetrics?.satisfactionRate || 0} allowHalf />
            </Card>
          </Col>
        </Row>

        {/* New Employment by Course Chart */}
        <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
          <Col xs={24}>
            <EmploymentByCourseChart />
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}><EmploymentPieChart /></Col>
          <Col xs={24} lg={12}><EmploymentTrendChart /></Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
          <Col xs={24} lg={12}><IndustryDistributionChart /></Col>
          <Col xs={24} lg={12}><SalaryProgressionChart /></Col>
        </Row>

        {/* Additional Data */}
        <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
          <Col xs={24} lg={12}><EmploymentByMajorTable /></Col>
          <Col xs={24} lg={12}><TopEmployersList /></Col>
        </Row>

        {/* Alternative Stacked Chart (optional) */}
        {/* <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
                    <Col xs={24}>
                        <EmploymentByCourseStackedChart />
                    </Col>
                </Row> */}
      </div>


      {/* Print Preview Modal — forced light theme via wrapClassName */}
      <Modal
        title="Print Preview - A4 Layout"
        open={printPreviewVisible}
        onCancel={handleClosePreview}
        width={900}
        style={{ top: 16, maxWidth: "calc(100vw - 16px)" }}
        styles={{ body: { maxHeight: "78vh", overflowY: "auto", padding: 0 } }}
        wrapClassName="print-preview-modal"
        className="print-preview-modal"
        footer={[
          <Button key="cancel" onClick={handleClosePreview}>
            Cancel
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handleActualPrint}>
            Print
          </Button>,
        ]}
      >
        <div className="print-preview-canvas">
        <div
          id="printable-area"
          data-print-theme="light"
          className="printable-area-surface"
          style={{
            backgroundColor: "#ffffff",
            color: "#0f172a",
          }}
        >
          {/* ===== Header with Logo ===== */}
          <div className="print-report-header" style={{ textAlign: "center", borderBottom: "2px solid #0f172a" }}>
            <img
              src={logo || "/placeholder.svg"}
              alt="OCC Logo"
              style={{ width: "80px", height: "80px", marginBottom: "10px", objectFit: "contain" }}
            />
            <Title level={2} style={{ margin: 0, color: "#0f172a" }}>
              Alumni Dashboard Report
            </Title>
            <Title level={4} style={{ margin: "8px 0", color: "#1890ff" }}>
              {year === "all" ? "All Years" : `Year ${year}`}
            </Title>
            <Text className="print-muted" style={{ color: "#555" }}>
              Generated on: {moment().format("MMMM DD, YYYY [at] hh:mm A")}
            </Text>
            <br />
            <Text className="print-muted" style={{ color: "#555" }}>
              Report Reference: ADR-{moment().format("YYYYMMDD-HHmmss")}
            </Text>
          </div>

          {/* ===== Executive Summary ===== */}
          <Card className="print-block">
            <Title level={4} className="print-section-title">Executive Summary</Title>
            <Paragraph style={{ color: "#0f172a", marginBottom: 8 }}>
              This report covers <Text strong>{totalAlumniSafe}</Text> alumni
              {year === "all" ? " across all graduation years" : ` from graduation year ${year}`}.
              The overall employment rate is <Text strong>{overallEmploymentRate}%</Text>, with{" "}
              <Text strong>{employedSafe}</Text> employed,{" "}
              <Text strong>{underEmployedSafe}</Text> under-employed, and{" "}
              <Text strong>{unemployedSafe}</Text> unemployed alumni on record.
              {bestCourse && (
                <>
                  {" "}The top-performing program is <Text strong>{bestCourse.course}</Text>{" "}
                  ({bestCourse.employmentRate}% employment rate).
                </>
              )}
              {topIndustry && (
                <>
                  {" "}The leading industry is <Text strong>{topIndustry.name}</Text>{" "}
                  ({topIndustry.value}% of placed alumni).
                </>
              )}
            </Paragraph>

            <div className="print-insight-grid">
              <div className="print-insight-item">
                <div className="print-insight-label">Total Alumni</div>
                <div className="print-insight-value">{totalAlumniSafe.toLocaleString()}</div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Active (last 5 years)</div>
                <div className="print-insight-value">{alumniMetrics?.activeThisYear || 0}</div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Employment Rate</div>
                <div className="print-insight-value">{overallEmploymentRate}%</div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Unemployment Rate</div>
                <div className="print-insight-value">{overallUnemploymentRate}%</div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Under-Employment Rate</div>
                <div className="print-insight-value">{overallUnderEmploymentRate}%</div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Average Salary</div>
                <div className="print-insight-value">₱{(alumniMetrics?.averageSalary || 0).toLocaleString()}</div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Best Performing Course</div>
                <div className="print-insight-value">
                  {bestCourse ? `${bestCourse.course} (${bestCourse.employmentRate}%)` : "—"}
                </div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Lowest Performing Course</div>
                <div className="print-insight-value">
                  {lowestCourse ? `${lowestCourse.course} (${lowestCourse.employmentRate}%)` : "—"}
                </div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Largest Cohort</div>
                <div className="print-insight-value">
                  {largestCohort ? `${largestCohort.course} (${largestCohort.total} alumni)` : "—"}
                </div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Top Industry</div>
                <div className="print-insight-value">
                  {topIndustry ? `${topIndustry.name} (${topIndustry.count} alumni)` : "—"}
                </div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Top Employer</div>
                <div className="print-insight-value">
                  {topEmployer ? `${topEmployer.name} (${topEmployer.hires} hires)` : "—"}
                </div>
              </div>
              <div className="print-insight-item">
                <div className="print-insight-label">Employment Trend (YoY)</div>
                <div className="print-insight-value">
                  {trendArr.length >= 2 ? `${yoYChange >= 0 ? "+" : ""}${yoYChange}% pts` : "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* ===== Key Metrics ===== */}
          <Card className="print-block">
            <Title level={4} className="print-section-title">Key Metrics</Title>
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <Title level={3} style={{ color: "#1890ff", margin: 0 }}>{totalAlumniSafe}</Title>
                  <Text style={{ color: "#0f172a" }}>Total Alumni</Text>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <Title level={3} style={{ color: "#52c41a", margin: 0 }}>{employedSafe}</Title>
                  <Text style={{ color: "#0f172a" }}>Employed ({overallEmploymentRate}%)</Text>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <Title level={3} style={{ color: "#ff4d4f", margin: 0 }}>{unemployedSafe}</Title>
                  <Text style={{ color: "#0f172a" }}>Unemployed ({overallUnemploymentRate}%)</Text>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <Title level={3} style={{ color: "#faad14", margin: 0 }}>{underEmployedSafe}</Title>
                  <Text style={{ color: "#0f172a" }}>Under Employed ({overallUnderEmploymentRate}%)</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* ===== Additional Metrics ===== */}
          <Card className="print-block">
            <Title level={4} className="print-section-title">Engagement & Salary Snapshot</Title>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: "center" }}>
                  <Title level={4} style={{ color: "#52c41a", margin: 0 }}>
                    {alumniMetrics?.activeThisYear || 0}
                  </Title>
                  <Text style={{ color: "#0f172a" }}>Active This Year</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: "center" }}>
                  <Title level={4} style={{ color: "#faad14", margin: 0 }}>
                    ₱{alumniMetrics?.averageSalary?.toLocaleString() || 0}
                  </Title>
                  <Text style={{ color: "#0f172a" }}>Average Salary</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: "center" }}>
                  <Title level={4} style={{ color: "#722ed1", margin: 0 }}>
                    {overallEmploymentRate}%
                  </Title>
                  <Text style={{ color: "#0f172a" }}>Employment Rate</Text>
                </div>
              </Col>
            </Row>

            {salaryValues.length > 0 && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <div className="print-insight-item">
                    <div className="print-insight-label">Minimum Reported Salary</div>
                    <div className="print-insight-value">₱{minSalary.toLocaleString()}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="print-insight-item">
                    <div className="print-insight-label">Median Reported Salary</div>
                    <div className="print-insight-value">₱{medianSalary.toLocaleString()}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="print-insight-item">
                    <div className="print-insight-label">Maximum Reported Salary</div>
                    <div className="print-insight-value">₱{maxSalary.toLocaleString()}</div>
                  </div>
                </Col>
              </Row>
            )}
          </Card>

          {/* ===== Employment by Course Chart ===== */}
          <Card className="print-block">
            <Title level={4} className="print-section-title">Employment Statistics by Course</Title>
            <div className="print-chart-box" style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={employmentByCourse} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="course" angle={-45} textAnchor="end" height={80} interval={0} fontSize={10} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="employed" name="Employed" fill="#32d1b3" barSize={15} />
                  <Bar yAxisId="left" dataKey="unemployed" name="Unemployed" fill="#ff4d4f" barSize={15} />
                  <Bar yAxisId="left" dataKey="underEmployed" name="Under Employed" fill="#faad14" barSize={15} />
                  <Line yAxisId="right" type="monotone" dataKey="employmentRate" name="Employment Rate" stroke="#1890ff" strokeWidth={2} dot={{ fill: "#1890ff", r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* ===== Employment Status Pie Chart ===== */}
          <Card className="print-block">
            <Title level={4} className="print-section-title">Overall Employment Status</Title>
            <Row gutter={16}>
              <Col span={12}>
                <div className="print-chart-box" style={{ width: "100%", height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={employmentData?.current || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(employmentData?.current || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value, name) => [`${value}%`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ paddingTop: "20px" }}>
                  {(employmentData?.current || []).map((item, index) => (
                    <div key={index} style={{ marginBottom: "12px", display: "flex", alignItems: "center" }}>
                      <div style={{ width: "16px", height: "16px", backgroundColor: item.color, marginRight: "10px", borderRadius: "4px" }} />
                      <Text style={{ marginRight: "10px", color: "#0f172a" }}>{item.name}:</Text>
                      <Text strong style={{ color: "#0f172a" }}>{item.value}%</Text>
                      <Text type="secondary" style={{ marginLeft: "8px", color: "#555" }}>
                        ({item.count} alumni)
                      </Text>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, fontSize: 11, color: "#555" }}>
                    Total accounted: {employedSafe + unemployedSafe + underEmployedSafe} of {totalAlumniSafe} alumni.
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* ===== Employment Trend Chart + Year-by-Year Table ===== */}
          <Card className="print-block">
            <Title level={4} className="print-section-title">Employment Trend (Last 6 Years)</Title>
            <div className="print-chart-box" style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={employmentData?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                  <Legend />
                  <Area type="monotone" dataKey="employed" stackId="1" stroke="#32d1b3" fill="#32d1b3" fillOpacity={0.6} name="Employed" />
                  <Area type="monotone" dataKey="underEmployed" stackId="1" stroke="#faad14" fill="#faad14" fillOpacity={0.6} name="Under Employed" />
                  <Area type="monotone" dataKey="unemployed" stackId="1" stroke="#ff4d4f" fill="#ff4d4f" fillOpacity={0.6} name="Unemployed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {trendArr.length > 0 && (
              <Table
                style={{ marginTop: 12 }}
                dataSource={trendArr}
                pagination={false}
                size="small"
                rowKey="month"
                columns={[
                  { title: "Year", dataIndex: "month", key: "month" },
                  { title: "Graduates", dataIndex: "totalGrads", key: "totalGrads" },
                  { title: "Employed", key: "emp", render: (_, r) => `${r.employedCount ?? 0} (${r.employed}%)` },
                  { title: "Unemployed", key: "un", render: (_, r) => `${r.unemployedCount ?? 0} (${r.unemployed}%)` },
                  { title: "Under Employed", key: "uemp", render: (_, r) => `${r.underEmployedCount ?? 0} (${r.underEmployed}%)` },
                ]}
              />
            )}
          </Card>

          {/* ===== Industry Distribution Chart ===== */}
          {industryDistribution.length > 0 && (
            <Card className="print-block">
              <Title level={4} className="print-section-title">Industry Distribution</Title>
              <div className="print-chart-box" style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={industryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Bar dataKey="value" name="Percentage">
                      {industryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList dataKey="value" position="top" formatter={(value) => `${value}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* ===== Salary Progression Chart ===== */}
          {salaryProgression.length > 0 && (
            <Card className="print-block">
              <Title level={4} className="print-section-title">Average Salary Progression</Title>
              <div className="print-chart-box" style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salaryProgression}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`₱${value?.toLocaleString() || 0}`, "Salary"]} />
                    <Line type="monotone" dataKey="salary" stroke="#1890ff" strokeWidth={2} dot={{ fill: "#1890ff" }} name="Salary" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#555" }}>
                Reported salary range: ₱{minSalary.toLocaleString()} – ₱{maxSalary.toLocaleString()} ·
                Median ₱{medianSalary.toLocaleString()} ·
                Mean ₱{(alumniMetrics?.averageSalary || 0).toLocaleString()}
              </div>
            </Card>
          )}

          {/* ===== Employment by Course Table ===== */}
          <Card className="print-block">
            <Title level={4} className="print-section-title">Employment Statistics by Course (Table)</Title>
            <Table
              dataSource={employmentByCourse}
              pagination={false}
              size="small"
              rowKey="course"
              columns={[
                { title: "No.", key: "index", width: 50, render: (_, __, index) => index + 1 },
                { title: "Course", dataIndex: "course", key: "course" },
                { title: "Total", dataIndex: "total", key: "total" },
                { title: "Employed", key: "employed", render: (_, record) => `${record.employed} (${record.employedPercentage}%)` },
                { title: "Unemployed", key: "unemployed", render: (_, record) => `${record.unemployed} (${record.unemployedPercentage}%)` },
                { title: "Under Employed", key: "underEmployed", render: (_, record) => `${record.underEmployed} (${record.underEmployedPercentage}%)` },
                { title: "Employment Rate", dataIndex: "employmentRate", key: "employmentRate", render: (value) => `${value}%` },
              ]}
              summary={(pageData) => {
                const totals = pageData.reduce(
                  (acc, r) => {
                    acc.total += r.total
                    acc.employed += r.employed
                    acc.unemployed += r.unemployed
                    acc.underEmployed += r.underEmployed
                    return acc
                  },
                  { total: 0, employed: 0, unemployed: 0, underEmployed: 0 }
                )
                const rate = totals.total > 0 ? Math.round((totals.employed / totals.total) * 100) : 0
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}><Text strong>TOTAL</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}><Text strong>{totals.total}</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}><Text strong>{totals.employed}</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={4}><Text strong>{totals.unemployed}</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={5}><Text strong>{totals.underEmployed}</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={6}><Text strong>{rate}%</Text></Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              }}
            />
          </Card>

          {/* ===== Employment by Major Table ===== */}
          {employmentData?.byMajor && employmentData.byMajor.length > 0 && (
            <Card className="print-block">
              <Title level={4} className="print-section-title">Employment by Major</Title>
              <Table
                dataSource={employmentData.byMajor}
                pagination={false}
                size="small"
                rowKey="major"
                columns={[
                  { title: "No.", key: "index", width: 50, render: (_, __, index) => index + 1 },
                  { title: "Major", dataIndex: "major", key: "major" },
                  { title: "Employed", dataIndex: "employed", key: "employed", render: (value) => `${value}%` },
                  { title: "Unemployed", dataIndex: "unemployed", key: "unemployed", render: (value) => `${value}%` },
                  { title: "Under Employed", dataIndex: "underEmployed", key: "underEmployed", render: (value) => `${value}%` },
                  { title: "Total Graduates", dataIndex: "totalGraduates", key: "totalGraduates" },
                ]}
              />
            </Card>
          )}

          {/* ===== Industry Distribution Table ===== */}
          {industryDistribution.length > 0 && (
            <Card className="print-block">
              <Title level={4} className="print-section-title">Industry Distribution (Table)</Title>
              <Table
                dataSource={industryDistribution}
                pagination={false}
                size="small"
                rowKey="name"
                columns={[
                  { title: "Rank", key: "index", width: 50, render: (_, __, index) => index + 1 },
                  { title: "Industry", dataIndex: "name", key: "name" },
                  { title: "Alumni Count", dataIndex: "count", key: "count", render: (value) => value ?? "—" },
                  { title: "Share", dataIndex: "value", key: "value", render: (value) => `${value}%` },
                ]}
              />
            </Card>
          )}

          {/* ===== Top Employers ===== */}
          {topEmployers.length > 0 && (
            <Card className="print-block">
              <Title level={4} className="print-section-title">Top Employers</Title>
              <Table
                dataSource={topEmployers}
                pagination={false}
                size="small"
                rowKey="name"
                columns={[
                  { title: "Rank", key: "index", width: 50, render: (_, __, index) => index + 1 },
                  { title: "Company", dataIndex: "name", key: "name" },
                  { title: "Hires", dataIndex: "hires", key: "hires" },
                  {
                    title: "Share of Placed",
                    key: "share",
                    render: (_, record) =>
                      employedSafe > 0 ? `${Math.round((record.hires / employedSafe) * 100)}%` : "—",
                  },
                ]}
              />
            </Card>
          )}

          {/* ===== Notes & Recommendations ===== */}
          <Card className="print-block">
            <Title level={4} className="print-section-title">Notes & Recommendations</Title>
            <ul style={{ color: "#0f172a", paddingLeft: 18, margin: 0, lineHeight: 1.7 }}>
              <li>
                Employment rate of <Text strong>{overallEmploymentRate}%</Text> is
                {overallEmploymentRate >= 80 ? " above target. Continue current career-services initiatives." :
                 overallEmploymentRate >= 60 ? " near target. Focus on under-employed conversion." :
                 " below target. Prioritize job-placement programs for affected cohorts."}
              </li>
              {lowestCourse && lowestCourse.employmentRate < 60 && (
                <li>
                  Course <Text strong>{lowestCourse.course}</Text> shows the lowest employment rate
                  ({lowestCourse.employmentRate}%). Consider targeted industry partnerships.
                </li>
              )}
              {topIndustry && (
                <li>
                  <Text strong>{topIndustry.name}</Text> is the dominant employment industry —
                  deepen recruiting relationships there.
                </li>
              )}
              {trendArr.length >= 2 && (
                <li>
                  Employment trend has {yoYChange >= 0 ? "improved" : "declined"} by{" "}
                  <Text strong>{Math.abs(yoYChange)} percentage points</Text> over the reporting window.
                </li>
              )}
            </ul>
          </Card>

          {/* ===== Signature + Footer — kept as ONE unbreakable block ===== */}
          <div className="print-closing-block">
            <div className="print-signature">
              <div className="sig-block">
                <div className="sig-line">Prepared by</div>
              </div>
              <div className="sig-block">
                <div className="sig-line">Reviewed by</div>
              </div>
              <div className="sig-block">
                <div className="sig-line">Approved by</div>
              </div>
            </div>

            <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px solid #d9d9d9", textAlign: "center" }}>
              <Text className="print-muted" style={{ color: "#555" }}>
                This is an official document generated from the Alumni Management System ·
                Page generated {moment().format("YYYY-MM-DD HH:mm")}
              </Text>
            </div>
          </div>
        </div>
        </div>
      </Modal>

      {/* Print Styles
          IMPORTANT: this block only handles page MECHANICS — what's
          visible, what's positioned where, what page size is used.
          It must never set width/height/padding/margin/font-size on
          #printable-area's content again: those live in one place,
          unconditionally, in AlumniDashboard.css. Two places setting
          the same appearance value is exactly what made the preview
          drift from the printed page before. */}
      <style jsx global>{`
  @media print {

    html, body, body[data-theme="black"], [data-theme="black"] {
      background: #ffffff !important;
      color: #0f172a !important;
    }

    /* Hide everything on the page except the report itself */
    body * {
      visibility: hidden !important;
    }

    #printable-area,
    #printable-area * {
      visibility: visible !important;
    }

    /* Lift the report out of the modal and let it fill the physical
       page. Size/padding are inherited from .printable-area-surface,
       which is already 190mm/277mm/8mm — matching the @page margin
       below — so nothing here needs to redeclare them. */
    #printable-area {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      margin: 0 !important;
      z-index: 999999 !important;
    }

    /* Collapse the modal chrome around the report */
    .ant-modal-mask,
    .ant-modal-wrap {
      position: static !important;
      background: none !important;
    }

    .ant-modal,
    .ant-modal-content {
      position: static !important;
      box-shadow: none !important;
      border: none !important;
      background: transparent !important;
    }

    .ant-modal-header,
    .ant-modal-footer,
    .ant-modal-close {
      display: none !important;
    }

    .ant-modal-body {
      padding: 0 !important;
    }

    /* The screen-only paper canvas (gray tray + shadow) shouldn't print */
    .print-preview-canvas {
      background: none !important;
      padding: 0 !important;
      overflow: visible !important;
    }
    .print-preview-canvas .printable-area-surface {
      box-shadow: none !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    @page {
      size: A4 portrait;
      margin: 10mm; /* matches the 190mm/277mm content box in AlumniDashboard.css:
                        210mm - 2×10mm = 190mm, 297mm - 2×10mm = 277mm */
    }

    html, body {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
  }
`}</style>

    </Layout>
  )
}

export default AlumniDashboard