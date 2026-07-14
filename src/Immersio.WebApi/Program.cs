using Immersio.Application.Interfaces;
using Immersio.Application.Services;
using Immersio.Infrastructure.Persistence;
using Immersio.Infrastructure.Services;
using Immersio.WebApi.Middlewares;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ──────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// ── DbContext ────────────────────────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<ApplicationDbContext>());

// ── JWT Authentication ───────────────────────────────────────────────
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

builder.Services.AddAuthorization();

// ── DI Registration ──────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ISrsService, SrsService>();
builder.Services.AddHttpClient<ILLMService, LlmService>();
builder.Services.AddScoped<IScenarioService, ScenarioService>();
builder.Services.AddScoped<IPronunciationService, PronunciationService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IImageUploadService, CloudinaryService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddHttpClient<IPayOsService, PayOsService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();

// ── Swagger ──────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Immersio API",
        Version = "v1",
        Description = "Immersio Web API with JWT Authentication"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── CORS ─────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// ── Auto-Migrate & Seed ──────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    // Run pending EF Core migrations automatically on startup
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();

    var scenarioService = scope.ServiceProvider.GetRequiredService<IScenarioService>();
    await scenarioService.SeedScenariosAsync(default);

    // Seed Admin User
    var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var existingAdmin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@immersio.com");
    if (existingAdmin == null)
    {
        var admin = new Immersio.Domain.Entities.User("admin", "admin@immersio.com", passwordHasher.Hash("Admin123!"));
        admin.SetRole("Admin");
        context.Users.Add(admin);
        await context.SaveChangesAsync(default);
    }
    else if (!passwordHasher.Verify("Admin123!", existingAdmin.PasswordHash))
    {
        // DEV-ONLY: Reset admin password if it doesn't match the dev default.
        // Remove this block before production deployment.
        existingAdmin.ResetPassword(passwordHasher.Hash("Admin123!"));
        await context.SaveChangesAsync(default);
    }
}

// ── Middleware Pipeline ──────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseCors("AllowAll");

app.UseStaticFiles();

app.UseSwagger(c =>
{
    c.RouteTemplate = "api/swagger/{documentName}/swagger.json";
});

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/api/swagger/v1/swagger.json", "Immersio API V1");
    c.RoutePrefix = "api/swagger";
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
