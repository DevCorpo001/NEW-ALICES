using FluentValidation;

namespace Alices.Application.Clases.AgregarClase;

public sealed class AgregarClaseCommandValidator : AbstractValidator<AgregarClaseCommand>
{
    public AgregarClaseCommandValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("El código de clase es obligatorio")
            .MaximumLength(20).WithMessage("El código de clase no puede superar 20 caracteres");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de clase es obligatorio")
            .MaximumLength(100).WithMessage("El nombre de clase no puede superar 100 caracteres");

        RuleFor(x => x.NombreCorto)
            .MaximumLength(20).WithMessage("El nombre corto no puede superar 20 caracteres");

        RuleFor(x => x.CodigoLinea)
            .MaximumLength(20).WithMessage("El código de línea no puede superar 20 caracteres");

        RuleFor(x => x.CodigoFamilia)
            .MaximumLength(20).WithMessage("El código de familia no puede superar 20 caracteres");
    }
}
