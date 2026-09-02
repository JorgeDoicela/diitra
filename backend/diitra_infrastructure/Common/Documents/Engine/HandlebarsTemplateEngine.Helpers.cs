using HandlebarsDotNet;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    public partial class HandlebarsTemplateEngine
    {
        private void RegisterCustomHelpers(IHandlebars handlebars)
        {
            // Helper: valor por defecto si la variable está vacía (soporta múltiples argumentos de fallback, colecciones y sub-expresiones)
            handlebars.RegisterHelper("default", (context, arguments) =>
            {
                bool isHtmlEmpty(object? val)
                {
                    if (val == null || val.GetType().Name == "UndefinedBindingResult") return true;
                    if (val is string s)
                    {
                        if (string.IsNullOrWhiteSpace(s)) return true;
                        var clean = Regex.Replace(s, @"<[^>]*>", "").Trim();
                        return string.IsNullOrWhiteSpace(clean);
                    }
                    if (val is IEnumerable enumerable && !(val is string))
                    {
                        var enumerator = enumerable.GetEnumerator();
                        return !enumerator.MoveNext();
                    }
                    return false;
                }

                foreach (var arg in arguments)
                {
                    if (!isHtmlEmpty(arg))
                    {
                        return arg;
                    }
                }
                return string.Empty;
            });

            // Helper: if_eq (comparación de igualdad de bloque para resiliencia con plantillas legacy)
            handlebars.RegisterHelper("if_eq", (output, options, context, arguments) =>
            {
                if (arguments.Length >= 2)
                {
                    var val1 = arguments[0]?.ToString() ?? "";
                    var val2 = arguments[1]?.ToString() ?? "";
                    if (string.Equals(val1, val2, StringComparison.OrdinalIgnoreCase))
                    {
                        options.Template(output, context);
                    }
                    else
                    {
                        options.Inverse(output, context);
                    }
                }
                else
                {
                    options.Inverse(output, context);
                }
            });

            // Helper: sumar múltiples valores numéricos (útil para totalizar rúbricas en el motor Handlebars)
            handlebars.RegisterHelper("sum", (output, context, arguments) =>
            {
                decimal total = 0;
                foreach (var arg in arguments)
                {
                    if (arg != null && arg.GetType().Name != "UndefinedBindingResult" && decimal.TryParse(arg.ToString(), out var val))
                    {
                        total += val;
                    }
                }
                output.WriteSafeString(total.ToString(CultureInfo.InvariantCulture));
            });

            // Helper: formatear fecha en español ecuatoriano
            handlebars.RegisterHelper("fecha_larga", (output, context, arguments) =>
            {
                var arg = arguments.ElementAtOrDefault(0);
                var isUndefined = arg == null || arg.GetType().Name == "UndefinedBindingResult";

                if (!isUndefined && DateTime.TryParse(arg!.ToString(), out var date))
                    output.WriteSafeString(date.ToString("dd 'de' MMMM 'de' yyyy", new CultureInfo("es-EC")));
                else
                    output.WriteSafeString("");
            });

            // Helper: formatear moneda
            handlebars.RegisterHelper("moneda", (output, context, arguments) =>
            {
                var arg = arguments.ElementAtOrDefault(0);
                var isUndefined = arg == null || arg.GetType().Name == "UndefinedBindingResult";

                if (!isUndefined && decimal.TryParse(arg!.ToString(), out var amount))
                    output.WriteSafeString($"${amount:N2}");
                else
                    output.WriteSafeString("$0.00");
            });

            // Helper: comparación de igualdad (útil para condicionales {{#if (eq a b)}})
            handlebars.RegisterHelper("eq", (context, arguments) =>
            {
                var a = arguments.ElementAtOrDefault(0);
                var b = arguments.ElementAtOrDefault(1);
                var aStr = (a == null || a.GetType().Name == "UndefinedBindingResult") ? string.Empty : a.ToString();
                var bStr = (b == null || b.GetType().Name == "UndefinedBindingResult") ? string.Empty : b.ToString();
                return aStr == bStr;
            });

            // Helper: negación
            handlebars.RegisterHelper("not", (context, arguments) =>
            {
                var val = arguments.ElementAtOrDefault(0);
                if (val is bool b) return !b;
                return val == null;
            });

            // Helper: conjunción lógica Y (and)
            handlebars.RegisterHelper("and", (context, arguments) =>
            {
                if (arguments.Length == 0) return false;
                foreach (var arg in arguments)
                {
                    if (arg == null) return false;
                    if (arg is bool b && !b) return false;
                    if (arg is string s && string.IsNullOrEmpty(s)) return false;
                    if (arg is int i && i == 0) return false;
                    if (arg is long l && l == 0) return false;
                    if (arg is decimal dec && dec == 0) return false;
                    if (arg is double d && d == 0) return false;
                }
                return true;
            });

            // Helper: disyunción lógica O (or)
            handlebars.RegisterHelper("or", (context, arguments) =>
            {
                if (arguments.Length == 0) return false;
                foreach (var arg in arguments)
                {
                    if (arg is bool b && b) return true;
                    if (arg is string s && !string.IsNullOrEmpty(s)) return true;
                    if (arg is int i && i != 0) return true;
                    if (arg is long l && l != 0) return true;
                    if (arg is decimal dec && dec != 0) return true;
                    if (arg is double d && d != 0) return true;
                    if (arg != null && !(arg is bool) && !(arg is string) && !(arg is int) && !(arg is long) && !(arg is decimal) && !(arg is double)) return true;
                }
                return false;
            });

            // Helper auxiliar para contar semanas
            int GetWeeksCount(object? cronogramaObj)
            {
                var cronogramaList = GetEnumerableProperty(cronogramaObj, "Cronograma", "cronograma") ?? cronogramaObj as IEnumerable;
                if (cronogramaList != null)
                {
                    int maxWeeks = 0;
                    foreach (var item in cronogramaList)
                    {
                        var semanasList = GetEnumerableProperty(item, "Semanas", "semanas");
                        if (semanasList != null)
                        {
                            int count = 0;
                            foreach (var _ in semanasList) count++;
                            if (count > maxWeeks) maxWeeks = count;
                        }
                    }
                    if (maxWeeks > 0) return maxWeeks;
                }
                return 12; // Fallback
            }

            // Helper: generar columnas de ancho col para el cronograma (dinámico)
            handlebars.RegisterHelper("generar_columnas_col", (output, context, arguments) =>
            {
                var cronograma = arguments.ElementAtOrDefault(0);
                var totalWidthObj = arguments.ElementAtOrDefault(1);

                double totalWidth = 64.0;
                if (totalWidthObj != null)
                {
                    double.TryParse(totalWidthObj.ToString(), out totalWidth);
                }

                int weeks = GetWeeksCount(cronograma);
                double width = totalWidth / weeks;
                var sb = new StringBuilder();
                for (int i = 0; i < weeks; i++)
                {
                    sb.Append("<col style=\"width: ").Append(width.ToString("F2", CultureInfo.InvariantCulture)).Append("%;\" />");
                }
                output.WriteSafeString(sb.ToString());
            });

            // Helper: agrupar objetivos dinámicamente y sólo mostrar el objetivo si cambió
            handlebars.RegisterHelper("mostrar_objetivo", (output, context, arguments) =>
            {
                var indexObj = arguments.ElementAtOrDefault(0);
                var listObj = arguments.ElementAtOrDefault(1);

                if (indexObj == null || listObj == null) return;

                int index = 0;
                if (indexObj is int idx) index = idx;
                else if (!int.TryParse(indexObj.ToString(), out index)) return;

                if (listObj is IEnumerable enumerable)
                {
                    var list = new ArrayList();
                    foreach (var item in enumerable) list.Add(item);

                    if (index < 0 || index >= list.Count) return;

                    var currentItem = list[index];
                    var currentObj = GetProperty(currentItem, "objetivo");

                    if (index == 0)
                    {
                        output.WriteSafeString(currentObj);
                        return;
                    }

                    var prevItem = list[index - 1];
                    var prevObj = GetProperty(prevItem, "objetivo");

                    if (currentObj != prevObj)
                    {
                        output.WriteSafeString(currentObj);
                    }
                }
            });

            // Helper: generar cabecera de meses de Gantt partiendo de la fecha de inicio del proyecto
            handlebars.RegisterHelper("generar_cabecera_meses", (output, context, arguments) =>
            {
                var startDateObj = arguments.ElementAtOrDefault(0);
                var cronograma = arguments.ElementAtOrDefault(1);
                int weeks = GetWeeksCount(cronograma);

                DateTime startDate = DateTime.Today;
                if (startDateObj != null)
                {
                    string dateStr = startDateObj.ToString() ?? "";
                    if (DateTime.TryParse(dateStr, out var parsedDate))
                    {
                        startDate = parsedDate;
                    }
                    else if (Regex.IsMatch(dateStr, @"^\d{2}/\d{2}/\d{4}$"))
                    {
                        var parts = dateStr.Split('/');
                        if (parts.Length == 3 && int.TryParse(parts[0], out int d) && int.TryParse(parts[1], out int m) && int.TryParse(parts[2], out int y))
                        {
                            try { startDate = new DateTime(y, m, d); } catch {}
                        }
                    }
                }

                var monthsNames = new string[] { "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };
                var sb = new StringBuilder();

                if (weeks <= 0)
                {
                    weeks = 12;
                }

                // Mapear cada semana a su mes correspondiente
                var weeksData = new List<(int MonthIndex, string MonthName, int Year)>();
                for (int w = 0; w < weeks; w++)
                {
                    DateTime weekStartDate = startDate.AddDays(w * 7);
                    weeksData.Add((weekStartDate.Month - 1, monthsNames[weekStartDate.Month - 1], weekStartDate.Year));
                }

                // Agrupar semanas consecutivas que caen en el mismo mes y año
                if (weeksData.Count > 0)
                {
                    var currentGroup = (MonthName: weeksData[0].MonthName, Year: weeksData[0].Year, WeeksCount: 1);
                    for (int i = 1; i < weeksData.Count; i++)
                    {
                        var w = weeksData[i];
                        if (w.MonthName == currentGroup.MonthName && w.Year == currentGroup.Year)
                        {
                            currentGroup.WeeksCount++;
                        }
                        else
                        {
                            sb.Append($"<th colspan=\"{currentGroup.WeeksCount}\" style=\"border: 1px solid #000000; padding: 4px; font-size: 8pt; background: #222c57; color: #ffffff; text-align: center; vertical-align: middle;\">")
                              .Append($"{currentGroup.MonthName} {currentGroup.Year}")
                              .Append("</th>");
                            currentGroup = (w.MonthName, w.Year, 1);
                        }
                    }
                    sb.Append($"<th colspan=\"{currentGroup.WeeksCount}\" style=\"border: 1px solid #000000; padding: 4px; font-size: 8pt; background: #222c57; color: #ffffff; text-align: center; vertical-align: middle;\">")
                      .Append($"{currentGroup.MonthName} {currentGroup.Year}")
                      .Append("</th>");
                }

                output.WriteSafeString(sb.ToString());
            });

            // Helper: generar cabecera de sub-semanas S1, S2, S3, S4 (dinámico)
            handlebars.RegisterHelper("generar_cabecera_semanas", (output, context, arguments) =>
            {
                var cronograma = arguments.ElementAtOrDefault(0);
                int weeks = GetWeeksCount(cronograma);
                var sb = new StringBuilder();
                for (int i = 0; i < weeks; i++)
                {
                    sb.Append("<th style=\"border: 1px solid #000000; padding: 2px; text-align: center; font-size: 6.5pt; color: #ffffff; background: #222c57;\">S<br/>")
                      .Append(i + 1)
                      .Append("</th>");
                }
                output.WriteSafeString(sb.ToString());
            });

            // Helper: generar las columnas de la tabla de cronograma basadas en la lista de semanas activa
            handlebars.RegisterHelper("columnas_gantt", (output, context, arguments) =>
            {
                var semanasObj = arguments.ElementAtOrDefault(0);
                var rowIndexObj = arguments.ElementAtOrDefault(1);
                var cronogramaRoot = arguments.ElementAtOrDefault(2);

                int rowIndex = 0;
                if (rowIndexObj is int r) rowIndex = r;
                else if (rowIndexObj != null) int.TryParse(rowIndexObj.ToString(), out rowIndex);

                var semanas = new List<bool>();
                var semanasEnum = GetEnumerableProperty(semanasObj, "Semanas", "semanas") ?? GetEnumerableProperty(context.Value, "Semanas", "semanas");
                if (semanasEnum != null)
                {
                    foreach (var item in semanasEnum)
                    {
                        if (item is bool b) semanas.Add(b);
                        else if (item != null && bool.TryParse(item.ToString(), out var bParsed)) semanas.Add(bParsed);
                        else semanas.Add(false);
                    }
                }

                int totalWeeks = GetWeeksCount(cronogramaRoot);
                int weeks = Math.Max(semanas.Count, totalWeeks);
                if (weeks <= 0) weeks = 12;

                var sb = new StringBuilder();
                string[] ganttColors = { "#9ad3de", "#f9cb9c", "#ea9999", "#4f81bd", "#0f243e", "#595959", "#ffc000", "#7030a0" };
                string activeColor = ganttColors[rowIndex % 8];

                for (int w = 0; w < weeks; w++)
                {
                    bool active = w < semanas.Count && semanas[w];
                    if (active)
                    {
                        sb.Append("<td class=\"bg-gantt-").Append(rowIndex % 8)
                          .Append("\" style=\"background-color: ").Append(activeColor)
                          .Append("; border: 1px solid #000000; padding: 0;\"></td>");
                    }
                    else
                    {
                        sb.Append("<td style=\"border: 1px solid #000000; padding: 0;\">&nbsp;</td>");
                    }
                }
                output.WriteSafeString(sb.ToString());
            });

            // Helper: generar las 8 filas de ejemplo para la tabla de cronograma como fallback
            handlebars.RegisterHelper("render_fallback_cronograma", (output, context, arguments) =>
            {
                var sb = new StringBuilder();
                for (int r = 0; r < 8; r++)
                {
                    sb.Append("<tr>");
                    if (r == 0)
                    {
                        sb.Append("<td rowspan=\"4\" style=\"border: 1px solid #000000; text-align: center; vertical-align: middle; font-weight: bold; font-size: 8pt; color: #000000;\">OBJETIVO<br/>N° 1</td>");
                    }
                    else if (r > 3)
                    {
                        sb.Append("<td style=\"border: 1px solid #000000;\">&nbsp;</td>");
                    }

                    sb.Append("<td style=\"border: 1px solid #000000; padding: 4px; text-align: center; vertical-align: middle; color: #000000;\">");
                    sb.Append(r < 4 ? (r + 1).ToString() : "&nbsp;");
                    sb.Append("</td>");

                    sb.Append("<td style=\"border: 1px solid #000000; padding: 4px; text-align: left; vertical-align: middle; color: #000000;\">");
                    sb.Append(r < 2 ? "Especificar la actividad" : "&nbsp;");
                    sb.Append("</td>");

                    sb.Append("<td style=\"border: 1px solid #000000; padding: 4px;\">&nbsp;</td>");

                    for (int w = 0; w < 48; w++)
                    {
                        bool active = false;
                        if (r == 0 && (w >= 1 && w <= 3)) active = true;
                        else if (r == 1 && (w >= 4 && w <= 7)) active = true;
                        else if (r == 2 && (w >= 8 && w <= 10)) active = true;
                        else if (r == 3 && (w >= 11 && w <= 15)) active = true;
                        else if (r == 4 && (w >= 16 && w <= 17)) active = true;
                        else if (r == 5 && (w >= 18 && w <= 23)) active = true;
                        else if (r == 6 && (w >= 24 && w <= 26)) active = true;
                        else if (r == 7 && (w >= 27 && w <= 31)) active = true;

                        if (active)
                        {
                            string[] ganttColors = { "#9ad3de", "#f9cb9c", "#ea9999", "#4f81bd", "#0f243e", "#595959", "#ffc000", "#7030a0" };
                            string activeColor = ganttColors[r % 8];
                            sb.Append("<td class=\"bg-gantt-").Append(r)
                              .Append("\" style=\"background-color: ").Append(activeColor)
                              .Append("; border: 1px solid #000000; padding: 0;\"></td>");
                        }
                        else
                        {
                            sb.Append("<td style=\"border: 1px solid #000000; padding: 0;\"></td>");
                        }
                    }
                    sb.Append("</tr>");
                }
                output.WriteSafeString(sb.ToString());
            });
        }
    }
}
