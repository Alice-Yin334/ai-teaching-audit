import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import "./App.css";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const steps = [
  "解析人才培养方案",
  "核查课程标准目标",
  "审核教学内容",
  "核查考核评价",
  "生成整改报告",
];

const auditModeOptions = [
  {
    value: "full",
    label: "完整审核：人培—课标—内容—考核",
  },
  {
    value: "quick",
    label: "快速审核：课标—内容",
  },
  {
    value: "assessment",
    label: "专项审核：考核一致性",
  },
];

const outputOptionsByMode = {
  full: [
    {
      value: "detailed",
      label: "详细诊断报告",
    },
    {
      value: "issues",
      label: "问题清单 + 整改建议",
    },
  ],
  quick: [
    {
      value: "issues",
      label: "问题清单 + 整改建议",
    },
  ],
  assessment: [
    {
      value: "assessment_report",
      label: "专项审核报告",
    },
  ],
};

const mockResultsByMode = {
  full: {
    score: 76,
    conclusion:
      "总体判断：基本一致，但存在课程目标表述、教学内容支撑和考核评价衔接不充分问题。",
    issues: [
      {
        level: "高",
        type: "目标与考核不一致",
        desc: "课程目标强调实践能力，但考核方案中实践项目权重偏低，且缺少明确评分标准。",
        suggestion:
          "建议提高项目化考核比例，并增加任务完成度、操作规范性、结果准确性等评分指标。",
      },
      {
        level: "中",
        type: "课程目标表述不够可评价",
        desc: "部分课程目标使用“了解、熟悉、掌握”等表述，缺少可观察、可评价的行为动词。",
        suggestion:
          "建议改为“能够解释、能够完成、能够分析、能够设计”等行为化表述。",
      },
      {
        level: "中",
        type: "教学内容支撑不足",
        desc: "课程标准要求学生完成综合项目任务，但教学材料中项目案例和任务单支撑不足。",
        suggestion:
          "建议增加真实岗位情境案例，并配套实训任务单和评价量表。",
      },
    ],
  },

  quick: {
    score: 82,
    conclusion:
      "总体判断：课程标准与教学内容基本匹配，但部分教学活动对能力目标的支撑还不够充分。",
    issues: [
      {
        level: "中",
        type: "教学内容覆盖不充分",
        desc: "课程标准中提出的综合实践任务，在教学材料中体现不够完整。",
        suggestion:
          "建议补充项目任务单、案例材料和课堂实施说明，使教学内容更好支撑课程目标。",
      },
      {
        level: "低",
        type: "学时安排需进一步明确",
        desc: "部分重点内容在授课计划中的学时安排不够清晰。",
        suggestion:
          "建议在授课计划中明确每个教学单元对应的课程目标、教学任务和学时安排。",
      },
    ],
  },

  assessment: {
    score: 68,
    conclusion:
      "总体判断：考核方式能够部分反映课程目标，但对实践能力和职业素养目标的评价不足。",
    issues: [
      {
        level: "高",
        type: "能力目标考核不足",
        desc: "课程目标强调岗位实践能力，但考核方案仍以理论测试为主。",
        suggestion:
          "建议增加项目化考核、过程性评价和操作性评价，并设置明确评分标准。",
      },
      {
        level: "中",
        type: "评价标准不够细化",
        desc: "考核材料中缺少针对作品质量、任务完成度、过程表现、职业规范等维度的评价量表。",
        suggestion:
          "建议建立分项评分表，明确不同等级的表现标准。",
      },
    ],
  },
};

function guessCourseNameFromFileName(fileName) {
  if (!fileName) return "";

  let name = fileName;

  name = name.replace(/\.(docx|doc|pdf|pptx|ppt|xlsx|xls)$/i, "");
  name = name.replace(/课程标准/g, "");
  name = name.replace(/教学大纲/g, "");
  name = name.replace(/课程大纲/g, "");
  name = name.replace(/人才培养方案/g, "");
  name = name.replace(/授课计划/g, "");
  name = name.replace(/教案/g, "");
  name = name.replace(/课件/g, "");
  name = name.replace(/[《》()（）【】\[\]_—\-]/g, " ");
  name = name.replace(/\s+/g, " ").trim();

  return name;
}

function FileUploadBox({ title, desc, files, setFiles }) {
  function handleChange(e) {
    setFiles(Array.from(e.target.files || []));
  }

  return (
    <div className="upload-card">
      <div className="upload-title">
        <FileText size={20} />
        <h3>{title}</h3>
      </div>

      <p>{desc}</p>

      <label className="upload-area">
        <Upload size={28} />
        <span>点击上传文件</span>
        <small>支持 PDF / Word / PPT / Excel，可多文件</small>
        <input type="file" multiple onChange={handleChange} />
      </label>

      <div className="file-list">
        {files.length === 0 ? (
          <span className="empty">暂未上传</span>
        ) : (
          files.map((file, index) => (
            <div className="file-item" key={index}>
              <span>{file.name}</span>
              <small>{Math.round(file.size / 1024)} KB</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [courseName, setCourseName] = useState("");
  const [auditMode, setAuditMode] = useState("full");
  const [outputType, setOutputType] = useState("detailed");
  const [llmProvider, setLlmProvider] = useState("deepseek");
  const [programFiles, setProgramFiles] = useState([]);
  const [syllabusFiles, setSyllabusFiles] = useState([]);
  const [materialFiles, setMaterialFiles] = useState([]);
  const [audited, setAudited] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [courseStandardInfo, setCourseStandardInfo] = useState(null);
  const [backendAuditResult, setBackendAuditResult] = useState(null);
  const [auditSource, setAuditSource] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState("");

  const currentResult =
  auditMode === "full" && backendAuditResult
    ? backendAuditResult
    : mockResultsByMode[auditMode];

  const canAudit =
    programFiles.length > 0 &&
    syllabusFiles.length > 0 &&
    materialFiles.length > 0;

  async function startAudit() {
    if (isAuditing) {
      return;
    }

    console.log("开始执行 startAudit");

    setIsAuditing(true);
    setAudited(false);
    setActiveStep(1);
    setCourseStandardInfo(null);
    setBackendAuditResult(null);
    setAuditSource("");
    setAuditError("");

    const formData = new FormData();

    formData.append("audit_mode", auditMode);
    formData.append("output_type", outputType);
    formData.append("llm_provider", llmProvider);
    
    programFiles.forEach((file) => {
      formData.append("program_files", file);
    });

    syllabusFiles.forEach((file) => {
      formData.append("syllabus_files", file);
    });

    materialFiles.forEach((file) => {
      formData.append("material_files", file);
    });

    try {
      console.log("准备上传文件到后端");

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      console.log("后端响应状态：", response.status);

      if (!response.ok) {
        throw new Error("文件上传失败");
      }

      const data = await response.json();
      console.log("后端返回结果：", data);

      if (data.detected_course_name) {
        setCourseName(data.detected_course_name);
      }

      if (data.course_standard_info) {
        setCourseStandardInfo(data.course_standard_info);
      }

      if (data.audit_result) {
        setBackendAuditResult(data.audit_result);
      }
      if (data.audit_source) {
        setAuditSource(data.audit_source);
   }

      let current = 0;

      const timer = setInterval(() => {
        current += 1;
        setActiveStep(current);

        if (current >= steps.length) {
          clearInterval(timer);
          setAudited(true);
        }
      }, 600);
    } catch (error) {
      console.error("上传或审核失败：", error);
      setAuditError("上传或审核失败，请检查后端是否正在运行。");
    } finally {
      setIsAuditing(false);
    }
  }
  async function exportWordReport() {
  const issues =
  currentResult?.issues?.length > 0
    ? currentResult.issues
    : [
        {
          level: "低",
          type: "未发现明显结构性问题",
          desc: "系统已识别到课程目标、教学内容和考核方式，三类要素较为完整。",
          suggestion: "建议进一步开展人工复核，重点检查课程目标、教学内容和考核方式之间的具体对应关系。",
        },
      ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "教学资料一致性审核报告",
            heading: HeadingLevel.TITLE,
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "课程名称：", bold: true }),
              new TextRun(courseName || "未识别"),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "审核模式：", bold: true }),
              new TextRun(
                auditModeOptions.find((item) => item.value === auditMode)
                  ?.label || auditMode
              ),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "输出类型：", bold: true }),
              new TextRun(
                outputOptionsByMode[auditMode].find(
                  (item) => item.value === outputType
                )?.label || outputType
              ),
            ],
          }),

          new Paragraph({
            text: "一、审核结果概览",
            heading: HeadingLevel.HEADING_1,
          }),

          new Paragraph(`一致性评分：${currentResult?.score ?? "暂无"} / 100`),
new Paragraph(
  `总体判断：${
    currentResult?.conclusion ||
    (currentResult?.score >= 85
      ? "课程标准结构较为完整，课程目标、教学内容和考核方式之间具备较好的基础一致性。"
      : "课程标准仍存在需要进一步完善的地方，建议结合课程目标、教学内容和考核方式进行人工复核。")
  }`
),

          new Paragraph({
            text: "二、课程标准解析结果",
            heading: HeadingLevel.HEADING_1,
          }),

          new Paragraph(
            `课程目标：${
              courseStandardInfo?.course_objectives?.length || 0
            } 条`
          ),
          new Paragraph(
            `教学内容：${
              courseStandardInfo?.teaching_content?.length || 0
            } 条`
          ),
          new Paragraph(
            `考核方式：${
              courseStandardInfo?.assessment_methods?.length || 0
            } 条`
          ),

          new Paragraph({
            text: "三、问题清单与整改建议",
            heading: HeadingLevel.HEADING_1,
          }),

          ...issues.flatMap((item, index) => [
            new Paragraph({
              text: `${index + 1}. ${item.type || "未命名问题"}（${
                item.level || "未定"
              }风险）`,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph(`问题描述：${item.desc || "暂无"}`),
            new Paragraph(`整改建议：${item.suggestion || "暂无"}`),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${courseName || "课程"}-教学资料一致性审核报告.docx`);
}

  return (
    <div className="page">
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header className="header">
          <div>
            <div className="badge">
              <Sparkles size={16} />
              AI教学资料一致性审核工作台
            </div>

            <h1>人培—课标—内容—考核一致性审核</h1>

            <p>
              上传人才培养方案、课程标准和教学实施材料，系统将分步核查课程目标、
              教学内容与考核评价之间的支撑关系。
            </p>
          </div>

          <button
            className={`primary-btn ${isAuditing ? "auditing" : ""}`}
            disabled={!canAudit || isAuditing}
            onClick={startAudit}
          >
            <Sparkles size={18} />
            {isAuditing ? "审核中，请稍候..." : "开始审核"}
          </button>
        </header>

        <section className="basic-card">
          <h2>基础信息</h2>

          <div className="form-grid">
            <div>
              <label>课程名称</label>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="上传课程标准后自动识别，也可手动填写"
              />
            </div>

            <div>
              <label>审核模式</label>
              <select
                value={auditMode}
                onChange={(e) => {
                  const newMode = e.target.value;
                  setAuditMode(newMode);
                  setOutputType(outputOptionsByMode[newMode][0].value);
                  setAudited(false);
                  setActiveStep(0);
                  setBackendAuditResult(null);
                }}
              >
                {auditModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>输出类型</label>
              <select
                value={outputType}
                onChange={(e) => {
                  setOutputType(e.target.value);
                  setAudited(false);
                  setActiveStep(0);
                }}
              >
                {outputOptionsByMode[auditMode].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>模型供应商</label>
              <select
                value={llmProvider}
                onChange={(e) => {
                  setLlmProvider(e.target.value);
                  setAudited(false);
                  setActiveStep(0);
                  setBackendAuditResult(null);
                }}
              >
                <option value="deepseek">DeepSeek</option>
                <option value="kimi">Kimi</option>
                <option value="doubao">豆包</option>
              </select>
            </div>
          </div>
        </section>

        <section className="upload-grid">
          <FileUploadBox
            title="人才培养方案"
            desc="作为上位标准，提取培养目标、毕业要求、课程体系。"
            files={programFiles}
            setFiles={setProgramFiles}
          />

          <FileUploadBox
            title="课程标准"
            desc="核查课程目标是否支撑人才培养方案要求。"
            files={syllabusFiles}
            setFiles={(files) => {
              setSyllabusFiles(files);

              if (!courseName && files.length > 0) {
                const guessedName = guessCourseNameFromFileName(files[0].name);
                setCourseName(guessedName);
              }
            }}
          />

          <FileUploadBox
            title="教学实施材料"
            desc="包括教案、课件、授课计划、任务单、考核方案等。"
            files={materialFiles}
            setFiles={setMaterialFiles}
          />
        </section>

        <section className="main-grid">
          <div className="process-card">
            <h2>AI分步审核流程</h2>

            <div className="step-list">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const done = activeStep > stepNumber;
                const current = activeStep === stepNumber;

                return (
                  <div
                    className={`step-item ${done ? "done" : ""} ${
                      current ? "current" : ""
                    }`}
                    key={step}
                  >
                    <div className="step-circle">
                      {done ? <CheckCircle2 size={18} /> : stepNumber}
                    </div>

                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="result-card">
            <h2>审核结果概览</h2>
            {auditSource && (
              <p className="result-text">
                审核来源：{auditSource}
              </p>
            )}

            {isAuditing && (
              <p className="loading-text">
                AI正在审核教学资料，请稍候。较大的PDF或调用外部模型时可能需要几十秒。
              </p>
            )}

            {auditError && !isAuditing && (
              <p className="error-text">{auditError}</p>
            )}

            {courseStandardInfo && (
              <div className="extract-card">
                <h3>课程标准解析结果</h3>

                <div className="extract-stats">
                  <div>
                    <strong>
                      {courseStandardInfo.course_objectives?.length || 0}
                    </strong>
                    <span>课程目标</span>
                  </div>
                  <div>
                    <strong>
                      {courseStandardInfo.teaching_content?.length || 0}
                    </strong>
                    <span>教学内容</span>
                  </div>
                  <div>
                    <strong>
                      {courseStandardInfo.assessment_methods?.length || 0}
                    </strong>
                    <span>考核方式</span>
                  </div>
                </div>

                <div className="extract-section">
                  <h4>课程目标</h4>
                  {courseStandardInfo.course_objectives?.length > 0 ? (
                    <ul>
                      {courseStandardInfo.course_objectives
                        .slice(0, 5)
                        .map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                    </ul>
                  ) : (
                    <p>暂未识别到课程目标。</p>
                  )}
                </div>

                <div className="extract-section">
                  <h4>教学内容</h4>
                  {courseStandardInfo.teaching_content?.length > 0 ? (
                    <ul>
                      {courseStandardInfo.teaching_content
                        .slice(0, 5)
                        .map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                    </ul>
                  ) : (
                    <p>暂未识别到教学内容。</p>
                  )}
                </div>

                <div className="extract-section">
                  <h4>考核方式</h4>
                  {courseStandardInfo.assessment_methods?.length > 0 ? (
                    <ul>
                      {courseStandardInfo.assessment_methods
                        .slice(0, 5)
                        .map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                    </ul>
                  ) : (
                    <p>暂未识别到考核方式。</p>
                  )}
                </div>
              </div>
            )}

            {audited ? (
              <>
                <div className="score">
                  {currentResult.score}
                  <span>/100</span>
                </div>

                <p className="result-text">{currentResult.conclusion}</p>

                <div className="issue-list">
                  {(currentResult.issues || []).map((item, index) => (
                    <div className="issue-item" key={index}>
                      <div className="issue-head">
                        <AlertTriangle size={16} />
                        <strong>{item.type}</strong>
                        <span>{item.level}风险</span>
                      </div>

                      <p>{item.desc}</p>

                      <small>建议：{item.suggestion}</small>
                    </div>
                  ))}
                </div>

                <button className="secondary-btn" onClick={exportWordReport}>
                  <Download size={18} />
                  导出
                  {
                    outputOptionsByMode[auditMode].find(
                      (item) => item.value === outputType
                    )?.label
                  }
                </button>
              </>
            ) : (
              <p className="placeholder">
                上传三类材料并点击“开始审核”后，此处将显示一致性评分、问题清单和整改建议。
              </p>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
