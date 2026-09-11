using FluentValidation;

namespace Alices.Application.Familias.AgregarFamilia;

public sealed class AgregarFamiliaCommandValidator : AbstractValidator<AgregarFamiliaCommand>
{
    public AgregarFamiliaCommandValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("El código de familia es obligatorio")
            .MaximumLength(20).WithMessage("El código de familia no puede superar 20 caracteres");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de familia es obligatorio")
            .MaximumLength(100).WithMessage("El nombre de familia no puede superar 100 caracteres");

        RuleFor(x => x.Abreviado)
            .MaximumLength(20).WithMessage("El abreviado no puede superar 20 caracteres");

        RuleFor(x => x.CodigoLinea)
            .MaximumLength(20).WithMessage("El código de línea no puede superar 20 caracteres");
    }
}
