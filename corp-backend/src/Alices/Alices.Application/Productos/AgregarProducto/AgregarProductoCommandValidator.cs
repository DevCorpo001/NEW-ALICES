using FluentValidation;

namespace Alices.Application.Productos.AgregarProducto;

public sealed class AgregarProductoCommandValidator : AbstractValidator<AgregarProductoCommand>
{
    public AgregarProductoCommandValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("El código de producto es obligatorio")
            .MaximumLength(30).WithMessage("El código de producto no puede superar 30 caracteres");

        RuleFor(x => x.Descripcion)
            .NotEmpty().WithMessage("El nombre técnico es obligatorio")
            .MaximumLength(200).WithMessage("El nombre técnico no puede superar 200 caracteres");

        RuleFor(x => x.NombreCorto)
            .MaximumLength(60).WithMessage("El nombre corto no puede superar 60 caracteres");

        RuleFor(x => x.IdProveedor)
            .NotNull().WithMessage("El proveedor es obligatorio");

        RuleFor(x => x.Unidad)
            .MaximumLength(10).WithMessage("La unidad no puede superar 10 caracteres");

        RuleFor(x => x.CodigoBarra)
            .MaximumLength(50).WithMessage("El código de barra no puede superar 50 caracteres");
    }
}
