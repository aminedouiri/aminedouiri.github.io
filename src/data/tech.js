/**
 * ✏️  TECH & FRAMEWORK CATALOGUE
 *
 * Every entry appears in the "Tech" menu. Entries with a 3D shape get a landmark beside the road
 * (the shape is looked up by `id` in src/three/landmarks/index.js).
 *
 *   id     unique key (also the 3D shape key)
 *   mono   text on the original monogram badge (not an official logo)
 *   name   big title above the 3D landmark
 *   short  name in menus and panels
 *   cat    category; "framework" gets amber styling
 *   use    "How I use it" text — write your own
 *   parts  optional [title, description] cards shown in the panel
 *   alias  optional id of another entry whose landmark this one reuses (no own 3D shape)
 *   big    the large landmark at the start of the road
 */
export const tech = [
  { id: "loop", mono: "∞", name: "DEVOPS LOOP", short: "DevOps loop", cat: "framework", big: true,
    use: "How I work end to end: plan, code, build, test, release, deploy, operate and monitor, then feed what we learn back into the plan." },
  { id: "calms", mono: "CA", name: "CALMS", short: "CALMS", cat: "framework",
    use: "The five things I check when helping a team adopt DevOps. [Add an example from your work.]",
    parts: [["Culture", "Shared ownership of outcomes"], ["Automation", "Pipelines over manual steps"], ["Lean", "Small batches, less waste"], ["Measurement", "Decide with data"], ["Sharing", "Knowledge and tools across teams"]] },
  { id: "dora", mono: "DR", name: "DORA METRICS", short: "DORA metrics", cat: "framework",
    use: "The four numbers I use to show delivery is getting faster and safer. [Add your before / after.]",
    parts: [["Deploy frequency", "How often we ship"], ["Lead time", "Commit to production"], ["Change failure rate", "Deploys that cause incidents"], ["Time to restore", "How fast we recover"]] },
  { id: "sre", mono: "SRE", name: "SRE PYRAMID", short: "SRE pyramid", cat: "framework",
    use: "The reliability hierarchy I build from the bottom up: you can only improve what you can see.",
    parts: [["1 · Monitoring", "See what is happening"], ["2 · Incident response", "Act fast when it breaks"], ["3 · Postmortems", "Learn without blame"], ["4 · Testing & release", "Ship safely"], ["5 · Capacity planning", "Stay ahead of growth"], ["6 · Product", "Build on a reliable base"]] },
  { id: "ways", mono: "3W", name: "THE THREE WAYS", short: "Three Ways", cat: "framework",
    use: "The principles behind how I set up delivery: fast flow to production, fast feedback back to dev, and room to experiment and learn.",
    parts: [["1 · Flow", "Dev to production, smoothly"], ["2 · Feedback", "Production back to dev, quickly"], ["3 · Learning", "Experiment and improve"]] },
  { id: "devsecops", mono: "DSO", name: "DEVSECOPS", short: "DevSecOps", cat: "framework",
    use: "Security built into every step of the pipeline instead of a check at the end: scan early, block risky changes automatically, keep watching in production. [Add an example from your work.]",
    parts: [["SAST", "Scan source code on every commit"], ["Deps / SCA", "Known-vulnerable libraries"], ["Secrets", "No keys or passwords in Git"], ["IaC scan", "Misconfigured infrastructure"], ["DAST", "Test the running app"], ["Runtime", "Detect threats in production"]] },
  { id: "mlops", mono: "ML", name: "MLOPS", short: "MLOps", cat: "framework",
    use: "DevOps for machine learning: versioned data, reproducible training, a model registry, automated deployment, and monitoring for drift that triggers retraining. [Add an example from your work.]",
    parts: [["Data", "Versioned, validated datasets"], ["Train", "Reproducible pipelines"], ["Evaluate", "Gate on accuracy before release"], ["Registry", "Every model version tracked"], ["Serve", "Automated, monitored deployment"], ["Retrain", "Drift triggers a new cycle"]] },

  { id: "k8s", mono: "K8s", name: "KUBERNETES", short: "Kubernetes", cat: "orchestration",
    use: "[Run N production services on EKS / GKE with Helm, autoscaling (HPA), network policies and zero-downtime rollouts.]" },
  { id: "docker", mono: "DK", name: "DOCKER", short: "Docker", cat: "containers",
    use: "[Containerise apps with small multi-stage images, scan them in CI and push to a private registry.]" },
  { id: "tf", mono: "TF", name: "TERRAFORM", short: "Terraform", cat: "infrastructure as code",
    use: "[Define networks, clusters and databases as reusable modules, reviewed in pull requests with plan output.]" },
  { id: "cicd", mono: "CI", name: "CI/CD PIPELINE", short: "CI/CD pipeline", cat: "GitHub Actions · GitLab CI",
    use: "[Every commit is built, tested, scanned and packaged automatically, then handed to Argo CD to deploy.]",
    parts: [["Build", "Container image per commit"], ["Test", "Unit and integration"], ["Scan", "Image and dependency checks"], ["Package", "Versioned artefact"], ["Deploy", "GitOps via Argo CD"]] },
  { id: "gha", mono: "GH", alias: "cicd", short: "GitHub Actions", cat: "CI pipelines",
    use: "[Reusable workflows shared across N repositories; build, test and scan on every pull request.]" },
  { id: "gitlab", mono: "GL", alias: "cicd", short: "GitLab CI", cat: "CI pipelines",
    use: "[.gitlab-ci.yml pipelines with stages, runners and environments for review apps.]" },
  { id: "argo", mono: "ACD", name: "ARGO CD", short: "Argo CD", cat: "GitOps delivery",
    use: "[Keep clusters in sync with Git; canary and blue-green releases with automatic rollback.]" },
  { id: "prom", mono: "PM", name: "PROMETHEUS", short: "Prometheus", cat: "metrics",
    use: "[Collect service and cluster metrics, write SLO-based alert rules routed to on-call.]" },
  { id: "otel", mono: "OT", name: "OPENTELEMETRY", short: "OpenTelemetry", cat: "traces",
    use: "[Instrument services for distributed tracing so slow requests can be followed end to end.]" },
  { id: "graf", mono: "GF", name: "GRAFANA", short: "Grafana", cat: "dashboards",
    use: "[Build team dashboards for latency, errors, saturation and cost.]" },
  { id: "proxmox", mono: "PVE", name: "PROXMOX", short: "Proxmox", cat: "virtualization",
    use: "[Run a 3-node Proxmox VE cluster with VMs and LXC containers, HA and live migration.]" },
  { id: "vmware", mono: "VM", name: "VMWARE", short: "VMware", cat: "virtualization",
    use: "[Operate vSphere: ESXi hosts managed by vCenter, vMotion, templates and resource pools.]" },
  { id: "net", mono: "NET", name: "NETWORKING", short: "Networking", cat: "routing · switching · firewalls",
    use: "[Design VLANs, routing and firewall rules; VPNs and load balancers; troubleshoot with tcpdump and traceroute.]" },
  { id: "gcp", mono: "GCP", name: "GOOGLE CLOUD", short: "Google Cloud", cat: "cloud platform",
    use: "[Run workloads on GKE, Cloud Run and Cloud SQL; manage IAM and networking with Terraform.]" },
];

export const isFramework = (t) => t.cat === "framework";
