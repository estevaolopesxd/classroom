using Amazon.S3;
using Amazon.S3.Model;
using Amazon.Runtime;
using Microsoft.Extensions.Configuration;

namespace Classroom.Infrastructure.Services;

public class MinIOStorageService
{
    private readonly AmazonS3Client _client;
    private readonly IConfiguration _configuration;

    public MinIOStorageService(IConfiguration configuration)
    {
        _configuration = configuration;
        var endpoint = configuration["MinIO:Endpoint"]!;
        var accessKey = configuration["MinIO:AccessKey"]!;
        var secretKey = configuration["MinIO:SecretKey"]!;

        var config = new AmazonS3Config
        {
            ServiceURL = $"http://{endpoint}",
            ForcePathStyle = true
        };

        _client = new AmazonS3Client(new BasicAWSCredentials(accessKey, secretKey), config);
    }

    public async Task<string> InitiateMultipartUpload(string bucket, string objectKey, string contentType)
    {
        var request = new InitiateMultipartUploadRequest
        {
            BucketName = bucket,
            Key = objectKey,
            ContentType = contentType
        };
        var response = await _client.InitiateMultipartUploadAsync(request);
        return response.UploadId;
    }

    public string GeneratePresignedPartUrl(string bucket, string objectKey, string uploadId, int partNumber)
    {
        // Generate a pre-signed URL for a specific multipart upload part
        var endpoint = _configuration["MinIO:Endpoint"]!;
        var accessKey = _configuration["MinIO:AccessKey"]!;
        var secretKey = _configuration["MinIO:SecretKey"]!;
        var publicEndpoint = _configuration["MinIO:PublicEndpoint"] ?? $"http://{endpoint}";

        // Build the URL with query parameters for pre-signed URL
        var expires = DateTimeOffset.UtcNow.AddMinutes(30);
        var expiresSeconds = (long)(expires - DateTimeOffset.UnixEpoch).TotalSeconds;

        // Return the signed URL pointing to the public endpoint
        var urlRequest = new GetPreSignedUrlRequest
        {
            BucketName = bucket,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            Expires = expires.UtcDateTime,
        };
        urlRequest.Parameters["uploadId"] = uploadId;
        urlRequest.Parameters["partNumber"] = partNumber.ToString();

        var url = _client.GetPreSignedURL(urlRequest);

        // Replace internal endpoint with public endpoint for browser access
        if (!string.IsNullOrEmpty(publicEndpoint))
        {
            url = url.Replace($"http://{endpoint}", publicEndpoint);
        }

        return url;
    }

    public async Task CompleteMultipartUpload(string bucket, string objectKey, string uploadId, List<(int PartNumber, string ETag)> parts)
    {
        var request = new CompleteMultipartUploadRequest
        {
            BucketName = bucket,
            Key = objectKey,
            UploadId = uploadId,
            PartETags = parts.Select(p => new PartETag(p.PartNumber, p.ETag)).ToList()
        };
        await _client.CompleteMultipartUploadAsync(request);
    }

    public async Task AbortMultipartUpload(string bucket, string objectKey, string uploadId)
    {
        await _client.AbortMultipartUploadAsync(new AbortMultipartUploadRequest
        {
            BucketName = bucket,
            Key = objectKey,
            UploadId = uploadId
        });
    }

    public string GeneratePresignedGetUrl(string bucket, string objectKey, int expirySeconds = 3600)
    {
        var publicEndpoint = _configuration["MinIO:PublicEndpoint"];
        var endpoint = _configuration["MinIO:Endpoint"]!;

        var url = _client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = bucket,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddSeconds(expirySeconds)
        });

        if (!string.IsNullOrEmpty(publicEndpoint))
            url = url.Replace($"http://{endpoint}", publicEndpoint);

        return url;
    }

    public async Task<string> GetPublicUrl(string bucket, string objectKey)
    {
        var publicEndpoint = _configuration["MinIO:PublicEndpoint"]!;
        return $"{publicEndpoint}/{bucket}/{objectKey}";
    }

    public async Task DeleteObject(string bucket, string objectKey)
    {
        await _client.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = bucket,
            Key = objectKey
        });
    }

    public async Task PutObjectAsync(string bucket, string objectKey, Stream stream, string contentType)
    {
        await _client.PutObjectAsync(new PutObjectRequest
        {
            BucketName = bucket,
            Key = objectKey,
            InputStream = stream,
            ContentType = contentType
        });
    }
}
