import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hierarchical Task Management System API",
      version: "1.0.0",
      description:
        "A comprehensive API for managing tasks in a hierarchical organizational structure with real-time notifications.",
      contact: {
        name: "API Support",
        email: "support@taskmanager.com",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Development server",
      },
      {
        url: "https://api.taskmanager.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for authentication",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "User ID",
            },
            name: {
              type: "string",
              description: "User full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            role: {
              type: "string",
              enum: ["CEO", "Manager", "Employee"],
              description: "User role in the organization",
            },
            managerId: {
              type: "string",
              description: "ID of the user's direct manager",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "User last update timestamp",
            },
          },
          required: ["name", "email", "role"],
        },
        Task: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Task ID",
            },
            title: {
              type: "string",
              description: "Task title",
            },
            description: {
              type: "string",
              description: "Task description",
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed"],
              description: "Task status",
            },
            assignedTo: {
              $ref: "#/components/schemas/User",
              description: "User assigned to the task",
            },
            createdBy: {
              $ref: "#/components/schemas/User",
              description: "User who created the task",
            },
            deadline: {
              type: "string",
              format: "date-time",
              description: "Task deadline",
            },
            comments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    description: "Comment message",
                  },
                  createdAt: {
                    type: "string",
                    format: "date-time",
                    description: "Comment creation timestamp",
                  },
                  createdBy: {
                    $ref: "#/components/schemas/User",
                    description: "User who created the comment",
                  },
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Task creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Task last update timestamp",
            },
          },
          required: ["title", "description", "assignedTo", "createdBy"],
        },
        Comment: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Comment message",
            },
          },
          required: ["message"],
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              description: "Success message",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Tasks",
        description: "Task management endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/models/*.ts"],
};

export const specs = swaggerJsdoc(options);
export default specs;
