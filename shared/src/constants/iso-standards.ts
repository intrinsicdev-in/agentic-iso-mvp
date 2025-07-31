export const ISO_9001_2015_CLAUSES = {
  "4": {
    title: "Context of the organization",
    subclauses: {
      "4.1": "Understanding the organization and its context",
      "4.2": "Understanding the needs and expectations of interested parties",
      "4.3": "Determining the scope of the quality management system",
      "4.4": "Quality management system and its processes"
    }
  },
  "5": {
    title: "Leadership",
    subclauses: {
      "5.1": "Leadership and commitment",
      "5.1.1": "General",
      "5.1.2": "Customer focus",
      "5.2": "Policy",
      "5.2.1": "Establishing the quality policy",
      "5.2.2": "Communicating the quality policy",
      "5.3": "Organizational roles, responsibilities and authorities"
    }
  },
  "6": {
    title: "Planning",
    subclauses: {
      "6.1": "Actions to address risks and opportunities",
      "6.2": "Quality objectives and planning to achieve them",
      "6.3": "Planning of changes"
    }
  },
  "7": {
    title: "Support",
    subclauses: {
      "7.1": "Resources",
      "7.1.1": "General",
      "7.1.2": "People",
      "7.1.3": "Infrastructure",
      "7.1.4": "Environment for the operation of processes",
      "7.1.5": "Monitoring and measuring resources",
      "7.1.6": "Organizational knowledge",
      "7.2": "Competence",
      "7.3": "Awareness",
      "7.4": "Communication",
      "7.5": "Documented information",
      "7.5.1": "General",
      "7.5.2": "Creating and updating",
      "7.5.3": "Control of documented information"
    }
  },
  "8": {
    title: "Operation",
    subclauses: {
      "8.1": "Operational planning and control",
      "8.2": "Requirements for products and services",
      "8.3": "Design and development of products and services",
      "8.4": "Control of externally provided processes, products and services",
      "8.5": "Production and service provision",
      "8.6": "Release of products and services",
      "8.7": "Control of nonconforming outputs"
    }
  },
  "9": {
    title: "Performance evaluation",
    subclauses: {
      "9.1": "Monitoring, measurement, analysis and evaluation",
      "9.1.1": "General",
      "9.1.2": "Customer satisfaction",
      "9.1.3": "Analysis and evaluation",
      "9.2": "Internal audit",
      "9.3": "Management review"
    }
  },
  "10": {
    title: "Improvement",
    subclauses: {
      "10.1": "General",
      "10.2": "Nonconformity and corrective action",
      "10.3": "Continual improvement"
    }
  }
};

export const ISO_27001_2022_CLAUSES = {
  "4": {
    title: "Context of the organization",
    subclauses: {
      "4.1": "Understanding the organization and its context",
      "4.2": "Understanding the needs and expectations of interested parties",
      "4.3": "Determining the scope of the information security management system",
      "4.4": "Information security management system"
    }
  },
  "5": {
    title: "Leadership",
    subclauses: {
      "5.1": "Leadership and commitment",
      "5.2": "Policy",
      "5.3": "Organizational roles, responsibilities and authorities"
    }
  },
  "6": {
    title: "Planning",
    subclauses: {
      "6.1": "Actions to address risks and opportunities",
      "6.1.1": "General",
      "6.1.2": "Information security risk assessment",
      "6.1.3": "Information security risk treatment",
      "6.2": "Information security objectives and planning to achieve them",
      "6.3": "Planning of changes"
    }
  },
  "7": {
    title: "Support",
    subclauses: {
      "7.1": "Resources",
      "7.2": "Competence",
      "7.3": "Awareness",
      "7.4": "Communication",
      "7.5": "Documented information",
      "7.5.1": "General",
      "7.5.2": "Creating and updating",
      "7.5.3": "Control of documented information"
    }
  },
  "8": {
    title: "Operation",
    subclauses: {
      "8.1": "Operational planning and control",
      "8.2": "Information security risk assessment",
      "8.3": "Information security risk treatment"
    }
  },
  "9": {
    title: "Performance evaluation",
    subclauses: {
      "9.1": "Monitoring, measurement, analysis and evaluation",
      "9.2": "Internal audit",
      "9.3": "Management review"
    }
  },
  "10": {
    title: "Improvement",
    subclauses: {
      "10.1": "Continual improvement",
      "10.2": "Nonconformity and corrective action"
    }
  }
};

// Annex A controls for ISO 27001:2022
export const ISO_27001_2022_ANNEX_A = {
  "A.5": {
    title: "Organizational controls",
    controls: {
      "A.5.1": "Policies for information security",
      "A.5.2": "Information security roles and responsibilities",
      "A.5.3": "Segregation of duties",
      "A.5.4": "Management responsibilities",
      "A.5.5": "Contact with authorities",
      "A.5.6": "Contact with special interest groups",
      "A.5.7": "Threat intelligence",
      "A.5.8": "Information security in project management",
      "A.5.9": "Inventory of information and other associated assets",
      "A.5.10": "Acceptable use of information and other associated assets",
      // ... continue with all controls
    }
  },
  "A.6": {
    title: "People controls",
    controls: {
      "A.6.1": "Screening",
      "A.6.2": "Terms and conditions of employment",
      "A.6.3": "Information security awareness, education and training",
      // ... continue with all controls
    }
  },
  "A.7": {
    title: "Physical controls",
    controls: {
      "A.7.1": "Physical security perimeters",
      "A.7.2": "Physical entry",
      // ... continue with all controls
    }
  },
  "A.8": {
    title: "Technological controls",
    controls: {
      "A.8.1": "User endpoint devices",
      "A.8.2": "Privileged access rights",
      // ... continue with all controls
    }
  }
};

// Keywords for clause detection
export const ISO_CLAUSE_KEYWORDS = {
  "4.1": ["context", "external issues", "internal issues", "strategic direction"],
  "4.2": ["interested parties", "stakeholders", "requirements", "expectations"],
  "4.3": ["scope", "boundaries", "applicability"],
  "4.4": ["processes", "interactions", "process approach"],
  "5.1": ["leadership", "commitment", "top management"],
  "5.2": ["policy", "quality policy", "information security policy"],
  "5.3": ["roles", "responsibilities", "authorities"],
  "6.1": ["risks", "opportunities", "risk assessment", "risk treatment"],
  "6.2": ["objectives", "planning", "measurable"],
  "7.1": ["resources", "infrastructure", "environment", "monitoring"],
  "7.2": ["competence", "training", "skills"],
  "7.3": ["awareness", "contribution", "implications"],
  "7.4": ["communication", "internal", "external"],
  "7.5": ["documented information", "documents", "records"],
  "8.1": ["operational", "planning", "control"],
  "9.1": ["monitoring", "measurement", "analysis", "evaluation"],
  "9.2": ["internal audit", "audit programme", "audit criteria"],
  "9.3": ["management review", "review inputs", "review outputs"],
  "10.1": ["improvement", "continual improvement"],
  "10.2": ["nonconformity", "corrective action", "root cause"]
};