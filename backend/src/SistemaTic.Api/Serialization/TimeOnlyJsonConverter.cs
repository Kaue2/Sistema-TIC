using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SistemaTic.Api.Serialization;

public sealed class TimeOnlyJsonConverter : JsonConverter<TimeOnly>
{
    private const string Format = "HH:mm";

    public override TimeOnly Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        string? value = reader.GetString();

        if (value is not null &&
            TimeOnly.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out TimeOnly time))
        {
            return time;
        }

        throw new JsonException($"Horário inválido: {value}");
    }

    public override void Write(
        Utf8JsonWriter writer,
        TimeOnly value,
        JsonSerializerOptions options)
    {
        writer.WriteStringValue(
            value.ToString(Format, CultureInfo.InvariantCulture));
    }
}
