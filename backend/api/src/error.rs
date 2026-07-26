//! API error types with automatic HTTP response conversion.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

/// All errors that the API can return.
#[derive(Debug, Error)]
pub enum ApiError {
    /// A database operation failed.
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    /// A requested resource was not found.
    #[error("Not found: {0}")]
    NotFound(String),

    /// The request body or parameters were invalid.
    #[error("Validation error: {0}")]
    Validation(String),

    /// An internal server error occurred.
    #[error("Internal server error: {0}")]
    Internal(String),

    /// Rate limit exceeded.
    #[error("Too many requests")]
    RateLimited,
}

/// JSON error response body.
#[derive(Serialize)]
struct ErrorBody {
    error: String,
    code: u16,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            ApiError::Database(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database operation failed".to_string(),
            ),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            ApiError::Validation(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg.clone()),
            ApiError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            ApiError::RateLimited => (
                StatusCode::TOO_MANY_REQUESTS,
                "Rate limit exceeded. Please slow down.".to_string(),
            ),
        };

        let body = ErrorBody {
            error: message,
            code: status.as_u16(),
        };

        (status, Json(body)).into_response()
    }
}
